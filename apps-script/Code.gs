/**
 * Role Competency Matching System – form-submit alert to Google Chat.
 *
 * Bound to the "Competencie Baseline" spreadsheet (which also receives the Form responses).
 *
 * Setup:
 *   1. Extensions ▸ Apps Script ▸ paste this file.
 *   2. Chat space ▸ space name ▸ Apps & integrations ▸ Webhooks ▸ Add ▸ copy the URL.
 *   3. Project Settings ▸ Script Properties ▸ add CHAT_WEBHOOK_URL (or edit the placeholder below).
 *   4. Run installTrigger() once and approve permissions.
 *   5. Run testWithLastRow() to verify.
 */
const CFG = {
  // Placeholder – or set Script Property CHAT_WEBHOOK_URL (preferred; keeps the key out of code).
  CHAT_WEBHOOK_URL: 'https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=KEY&token=TOKEN',
  EMAIL_FALLBACK_TO: '',              // e.g. 'hiring.manager@company.com'; '' = no Gmail fallback
  RESPONSES_SHEET: 'Form Responses 1',
  ENGINE_SHEET: 'Algorithm Engine',
  NUM_COMPETENCIES: 9,
  COL: {                              // 1-based columns in Algorithm Engine
    EMAIL: 2, NAME: 3, DISCIPLINE: 4, ROLE: 5,
    SELF: 6, REQ: 15, PRI: 24, GAP: 33,
    MATCH: 42, CRIT_COUNT: 43, READINESS: 45, MEETS: 46, ALERT: 47
  },
  WAIT_FOR_CALC_MS: 20000
};
const PRIORITY_RANK = { Critical: 4, High: 3, Medium: 2, Med: 2, Low: 1 };

/** Installable trigger handler: Spreadsheet ▸ On form submit. */
function onFormSubmit(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (e && e.range && e.range.getSheet().getName() !== CFG.RESPONSES_SHEET) return;
  const row = (e && e.range) ? e.range.getRow()
                             : ss.getSheetByName(CFG.RESPONSES_SHEET).getLastRow();

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);                       // serialise simultaneous submissions
  try {
    const engine = ss.getSheetByName(CFG.ENGINE_SHEET);
    const alertCell = engine.getRange(row, CFG.COL.ALERT);
    if (String(alertCell.getValue()).indexOf('Sent') === 0) return;   // duplicate-trigger guard

    const data = waitForEngineRow_(engine, row);
    const names = engine.getRange(1, CFG.COL.SELF, 1, CFG.NUM_COMPETENCIES).getValues()[0];
    const gaps = collectGaps_(data, names);
    const link = ss.getUrl() + '#gid=' + engine.getSheetId() + '&range=A' + row + ':AU' + row;

    let ok = postToChat_(buildChatMessage_(data, gaps, link));
    if (!ok && CFG.EMAIL_FALLBACK_TO) ok = sendEmail_(data, gaps, link);

    const stamp = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm');
    alertCell.setValue((ok ? 'Sent ' : 'FAILED ') + stamp);
  } finally {
    lock.releaseLock();
  }
}

/** Waits until the ARRAYFORMULAs have recalculated the new row. */
function waitForEngineRow_(engine, row) {
  const deadline = Date.now() + CFG.WAIT_FOR_CALC_MS;
  let vals;
  do {
    SpreadsheetApp.flush();
    vals = engine.getRange(row, 1, 1, CFG.COL.ALERT).getValues()[0];
    if (vals[CFG.COL.ROLE - 1] !== '' && vals[CFG.COL.MATCH - 1] !== '') return vals;
    Utilities.sleep(1500);
  } while (Date.now() < deadline);
  return vals;
}

/** Every competency below requirement, Critical first, then largest shortfall. */
function collectGaps_(d, names) {
  const gaps = [];
  for (let i = 0; i < CFG.NUM_COMPETENCIES; i++) {
    const self = d[CFG.COL.SELF - 1 + i], req = d[CFG.COL.REQ - 1 + i], pri = d[CFG.COL.PRI - 1 + i];
    if (self === '' || req === '' || Number(self) >= Number(req)) continue;
    gaps.push({ name: names[i], self: self, req: req, pri: pri || 'n/a', short: req - self });
  }
  return gaps.sort((a, b) =>
    (PRIORITY_RANK[b.pri] || 0) - (PRIORITY_RANK[a.pri] || 0) || b.short - a.short);
}

function formatMatch_(m) {
  return typeof m === 'number' ? (m * 100).toFixed(1) + '%' : (m || 'Not calculated');
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildChatMessage_(d, gaps, link) {
  const C = CFG.COL;
  const match = d[C.MATCH - 1];
  const meets = d[C.MEETS - 1] === 'Yes';
  const color = typeof match !== 'number' ? '#5F6368'
              : meets ? '#188038' : match >= 0.75 ? '#E37400' : '#D93025';

  const critical = gaps.filter(g => g.pri === 'Critical');
  const other = gaps.filter(g => g.pri !== 'Critical').slice(0, 5);
  const line = g => '• <b>' + esc_(g.name) + '</b>: self ' + g.self + ' vs req ' + g.req +
                    ' (' + esc_(g.pri) + ')';

  const name = esc_(d[C.NAME - 1]), role = esc_(d[C.ROLE - 1]);
  return {
    text: 'New self-assessment: ' + d[C.NAME - 1] + ' – ' + d[C.ROLE - 1] + ' – ' + formatMatch_(match),
    cardsV2: [{
      cardId: 'match-' + Date.now(),
      card: {
        header: { title: '🎯 New Candidate Self-Assessment', subtitle: role },
        sections: [
          { widgets: [
            { decoratedText: { topLabel: 'Candidate', text: '<b>' + name + '</b>',
                               bottomLabel: esc_(d[C.EMAIL - 1]), startIcon: { knownIcon: 'PERSON' } } },
            { decoratedText: { topLabel: 'Role · Discipline',
                               text: role + ' · ' + esc_(d[C.DISCIPLINE - 1]),
                               startIcon: { knownIcon: 'BOOKMARK' } } },
            { decoratedText: { topLabel: 'Match Score',
                               text: '<b><font color="' + color + '">' + formatMatch_(match) + '</font></b>' +
                                     (meets ? '  ✅ meets threshold' : '  ⚠️ below threshold'),
                               bottomLabel: 'Readiness: ' + d[C.READINESS - 1],
                               startIcon: { knownIcon: 'STAR' } } }
          ]},
          { header: '🚩 Critical gaps (' + critical.length + ')', widgets: [
            { textParagraph: { text: critical.length
                ? '<font color="#D93025">' + critical.map(line).join('<br>') + '</font>'
                : 'None – all Critical competencies meet the requirement.' } }
          ]},
          { header: 'Other gaps', collapsible: other.length > 0, uncollapsibleWidgetsCount: 0, widgets: [
            { textParagraph: { text: other.length ? other.map(line).join('<br>') : 'None' } }
          ]},
          { widgets: [{ buttonList: { buttons: [
            { text: 'Open in Algorithm Engine', onClick: { openLink: { url: link } } }
          ]}}]}
        ]
      }
    }]
  };
}

function postToChat_(message) {
  const url = PropertiesService.getScriptProperties().getProperty('CHAT_WEBHOOK_URL') || CFG.CHAT_WEBHOOK_URL;
  if (!url || url.indexOf('SPACE_ID') !== -1) {
    console.warn('Chat webhook URL not configured.');
    return false;
  }
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    payload: JSON.stringify(message),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  if (code >= 200 && code < 300) return true;
  console.error('Chat webhook failed: ' + code + ' ' + res.getContentText());
  return false;
}

function sendEmail_(d, gaps, link) {
  const C = CFG.COL;
  const rows = gaps.map(g => '<li><b>' + esc_(g.name) + '</b> – self ' + g.self + ' vs req ' + g.req +
                             ' (' + esc_(g.pri) + ')</li>').join('');
  MailApp.sendEmail({
    to: CFG.EMAIL_FALLBACK_TO,
    subject: 'Candidate match: ' + d[C.NAME - 1] + ' – ' + d[C.ROLE - 1] + ' – ' + formatMatch_(d[C.MATCH - 1]),
    htmlBody: '<p><b>' + esc_(d[C.NAME - 1]) + '</b> (' + esc_(d[C.ROLE - 1]) + ')<br>Match Score: <b>' +
              formatMatch_(d[C.MATCH - 1]) + '</b> · ' + esc_(d[C.READINESS - 1]) + '</p>' +
              '<p>Gaps:</p><ul>' + (rows || '<li>None</li>') + '</ul>' +
              '<p><a href="' + link + '">Open in Algorithm Engine</a></p>'
  });
  return true;
}

/** Run once: installs the spreadsheet "On form submit" trigger (removes duplicates first). */
function installTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'onFormSubmit')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
}

/** Manual test: re-sends the alert for the most recent response. */
function testWithLastRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const row = ss.getSheetByName(CFG.RESPONSES_SHEET).getLastRow();
  ss.getSheetByName(CFG.ENGINE_SHEET).getRange(row, CFG.COL.ALERT).clearContent();
  onFormSubmit(null);
}
