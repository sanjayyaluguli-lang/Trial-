# Quick Start — Try It on a Personal Gmail Account

About 30–45 minutes. Everything runs free on a personal `@gmail.com` account.

> **One difference from the Workspace setup.** Personal Google accounts can't create Google Chat
> **incoming webhooks**; that's a Workspace-only feature. On Gmail you get the alert as an
> **email** instead. The script already falls back to email when no webhook is set, so you only set
> `EMAIL_FALLBACK_TO`.

---

## Step 1 — Put the baseline into Google Sheets (5 min)

1. Go to <https://drive.google.com> ▸ **New ▸ File upload** ▸ choose `Competencie_Baseline.xlsx`.
2. Double-click the uploaded file ▸ **File ▸ Save as Google Sheets**. This creates a real Google
   Sheet; the `.xlsx` preview can't run scripts.
3. Rename it **Competencie Baseline**. Check that the tab names match these exactly:
   `Matrix Ops Manager`, `Matrix Senior PM`, `Matrix Chief Engineer`,
   `Matrix Senior Principle TPM`, `Matrix Quality Lead`.

> For your first test, use **Senior PM** or **Quality Lead**. They're the only roles with a
> complete baseline. Chief Engineer and Senior Principal TPM will show `BASELINE MISSING`.

## Step 2 — Add the helper tabs (5 min)

> **European locale?** If your spreadsheet uses `;` between function arguments (you get a
> *formula parse error* on paste), copy every formula from
> [`sheets/formulas-eu.md`](../sheets/formulas-eu.md) instead of `sheets/formulas.md`. You can check
> or change the locale under **File ▸ Settings ▸ Locale**.

In the spreadsheet, click **+** (bottom left) to add each tab, following
[`sheets/formulas.md`](../sheets/formulas.md):

1. **`Role_Map`**: type the 5-row table (Role / Tab / Threshold).
2. **`Weights`**: type the priority/weight table.
3. **`Baseline_Master`**: paste the formula into **A1**. You should see about 46 rows:
   5 roles × 9 competencies, plus a header.
   - ✅ Check: filter column B for `Senior PM`. Required values should read 3, 4, 4, 3, 3, 3, 3, 3, 2.

Leave `Algorithm Engine` for Step 4. It needs the form's response tab to exist first.

## Step 3 — Build the Google Form (10–15 min)

1. In the spreadsheet: **Tools ▸ Create a new form**. This links the form automatically and
   creates the `Form Responses 1` tab.
   - On a non-English account the tab gets a translated name, e.g. *Formularantworten 1*. Rename
     it to `Form Responses 1` (the form keeps writing to it) so the formulas work unchanged.
2. **Settings ▸ Responses:**
   - Collect email addresses: **Verified** (respondents sign in with Google)
   - Allow response editing: **Off**
3. Build the sections per [`docs/form-layout.md`](form-layout.md). Shortcut for a first test:
   skip the role introduction sections 2A–2E. Use a plain Multiple choice role question, then one
   section per domain.
4. **Question order matters:** Full Name → Discipline → Role → the 9 ratings in baseline order →
   optional Evidence.
5. Each rating question is a **Linear scale 1 to 4**, and its title must be the exact competency
   name, e.g. `Decisive Judgment under Ambiguity`.
6. Go back to the spreadsheet. Row 1 of `Form Responses 1` should read:
   `Timestamp | Email Address | Full Name | Discipline | Role… | Systems Thinking & Business Alignment | … | Domain Mastery & Application`
   - The role header will be your full question text. That's fine: the formulas use column
     position, not that header.

## Step 4 — Add the Algorithm Engine (5 min)

1. Add a tab named exactly **`Algorithm Engine`**.
2. Paste the formulas from [`sheets/formulas.md`](../sheets/formulas.md) into **A1, O1, X1, AG1,
   AP1, AQ1, AR1, AS1, AT1**. Type `Alert Status` in **AU1**.
3. Select column **AP** ▸ **Format ▸ Number ▸ Percent**.
4. If a cell shows `#REF! … would overwrite data`, clear everything below row 1 in that column.

## Step 5 — Add the Apps Script (5 min)

1. In the spreadsheet: **Extensions ▸ Apps Script**.
2. Delete the sample code in `Code.gs` and paste the whole of
   [`apps-script/Code.gs`](../apps-script/Code.gs).
3. Near the top, set your email address:
   ```js
   EMAIL_FALLBACK_TO: 'you@gmail.com',
   ```
   Leave `CHAT_WEBHOOK_URL` as the placeholder. With no webhook, the script sends the email instead.
4. Click **💾 Save**.
5. In the function dropdown pick **`installTrigger`** ▸ **Run**, then approve access:
   - Choose your account.
   - You'll see "Google hasn't verified this app". This is normal for your own script. Click
     **Advanced ▸ Go to (project name) (unsafe) ▸ Allow**.
   - It asks for Sheets, external requests and sending email as you.
6. Check it worked: in the left sidebar, **⏰ Triggers** should list `onFormSubmit`,
   *From spreadsheet – On form submit*.

## Step 6 — Test it (5 min)

1. Open the form (**Send ▸ 🔗 link**, or the 👁 Preview icon in the form editor).
2. Submit this test response:
   - Name `Test Candidate`
   - Discipline `Engineering`
   - Role **`Senior PM`**
   - **Every rating = 3**
3. Within about 30 seconds, check:

| Where | Expected |
|---|---|
| `Algorithm Engine` row 2, **AP** | **90.1%** (91 ÷ 101) |
| **AQ** / **AR** | `2` — Decisive Judgment under Ambiguity (self 3 vs req 4); End-to-End Ownership (self 3 vs req 4) |
| **AS** | `Ready 1-2 Yrs`: over 90%, but it has Critical gaps |
| **AT** | `Yes` (≥ 80% threshold) |
| **AU** | `Sent 2026-…` |
| Your Gmail inbox | *"Candidate match: Test Candidate – Senior PM – 90.1%"* |

Why 90.1%: the Senior PM weighted maximum is 101. Being one level short on two Critical
competencies loses 5 + 5 = 10 points, giving 91/101.

**Didn't get the email?**

1. In Apps Script, pick **`diagnose`** in the function dropdown ▸ **Run**. It prints a ✅/❌
   checklist in the Execution log and sends you a plain test email.
2. Check **Algorithm Engine column AU** on your response row. A failed alert writes
   `FAILED … : <reason>` there.
3. In Gmail, also look in **Sent** and **All Mail**. Gmail sometimes files mail you send to
   yourself only there.
4. Open **≡ Executions** (left sidebar) for the full error of each `onFormSubmit` run.

Common causes:

| Symptom | Fix |
|---|---|
| `Cannot read properties of null (reading 'getRange')` | A tab name is wrong. It must be `Algorithm Engine` / `Form Responses 1` exactly. |
| AP shows blank or `BASELINE MISSING` | The role text doesn't match `Role_Map` column A, or a question title doesn't match the competency name. |
| AU says `FAILED` | `EMAIL_FALLBACK_TO` is empty. |
| `#N/A` filling every column after the first in a block (e.g. P–W) | An older version of the O1, X1, AG1 or AR1 formula. Copy those four formulas again from `sheets/formulas.md`. |
| No execution listed at all | The trigger isn't installed, or the response was submitted before you installed it. Rerun `installTrigger`, then run `testWithLastRow`. |
| `diagnose` says *Script is not bound to a spreadsheet* | The script was created from the Form editor. Create it from the spreadsheet instead (**Extensions ▸ Apps Script**). |

To resend for the last row without submitting again: run **`testWithLastRow`**.

## Step 7 (optional) — Dashboard (10 min)

1. Add the **`Candidate_Roster`** tab with 2–3 fake people, including one who hasn't submitted.
   Add the **`Dashboard_Feed`** tab with its A1 formula.
2. Go to <https://lookerstudio.google.com> ▸ **Blank report** ▸ **Google Sheets** ▸
   *Competencie Baseline* ▸ `Dashboard_Feed` ▸ **Add**.
3. Follow [`docs/looker-studio.md`](looker-studio.md) for the scorecard, bar chart, table, donut
   and filters.

## Moving to Workspace later

On a company Workspace account:
1. Create the Chat webhook (space ▸ Apps & integrations ▸ Webhooks).
2. Add it as Script Property `CHAT_WEBHOOK_URL`.

Alerts then go to Chat. Email becomes the fallback only if Chat fails.
