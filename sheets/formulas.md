# Google Sheets Setup & Formulas

All tabs live in the **Competencie Baseline** spreadsheet, which the Google Form is linked to.

Expected `Form Responses 1` layout (produced by the form in [`docs/form-layout.md`](../docs/form-layout.md)):

`A Timestamp | B Email | C Full Name | D Discipline | E Role | F–N 9 ratings | O Evidence`

> **Never sort `Form Responses 1` or `Algorithm Engine`.** Engine row *n* = response row *n*; the
> Apps Script relies on this. Keep the engine tab at least as many rows long as the responses tab.

> **Formula style.** These formulas use US/UK separators (`,` between arguments). If your
> spreadsheet uses a European locale (File ▸ Settings ▸ Locale, e.g. Germany, France, Netherlands)
> you'll get a *formula parse error*. Use [`formulas-eu.md`](formulas-eu.md) instead: identical
> formulas with `;` between arguments, `\` between array columns and `0,9`-style decimals.

---

## 1. `Role_Map` (typed by hand)

Column A must match the form's role choices exactly.

| A Role | B Tab | C Threshold |
|---|---|---|
| Operations Manager | Matrix Ops Manager | 80% |
| Senior PM | Matrix Senior PM | 80% |
| Chief Engineer | Matrix Chief Engineer | 80% |
| Senior Principal TPM | Matrix Senior Principle TPM | 80% |
| Quality Lead | Matrix Quality Lead | 80% |

## 2. `Weights` (typed by hand)

This table sets how much more a Critical gap costs than a Low one.

| A Priority | B Weight |
|---|---|
| Critical | 5 |
| High | 3 |
| Medium | 2 |
| Med | 2 |
| Low | 1 |

## 3. `Baseline_Master` — cell A1

Stacks every role tab into one lookup table: `Key | Role | Competency | Priority | Required | Weight`.
`LEFT(…,1)` turns `"3 - Proficient…"` into `3`. The fixed range `B3:B11` skips the scale legend
below row 11 on the Chief Engineer tab.

```
=REDUCE(
  {"Key","Role","Competency","Priority","Required","Weight"},
  FILTER(Role_Map!A2:A, Role_Map!A2:A<>""),
  LAMBDA(acc, role, LET(
    tab,  VLOOKUP(role, Role_Map!A2:B, 2, FALSE),
    comp, INDIRECT("'" & tab & "'!B3:B11"),
    pri,  INDIRECT("'" & tab & "'!E3:E11"),
    req,  INDIRECT("'" & tab & "'!F3:F11"),
    VSTACK(acc, FILTER(HSTACK(
      role & "|" & TRIM(comp),
      IF(comp = "", "", role),
      TRIM(comp),
      PROPER(TRIM(pri)),
      IF(req = "", "", IFERROR(VALUE(LEFT(TRIM(req), 1)))),
      IFERROR(VLOOKUP(PROPER(TRIM(pri)), Weights!A2:B, 2, FALSE), 0)
    ), comp <> ""))
  ))
)
```

---

## 4. `Algorithm Engine` — one formula per block, all in row 1

| Columns | Block |
|---|---|
| A–N | Copy of responses (Timestamp, Email, Name, Discipline, Role, 9 self-scores) |
| O–W | Required level |
| X–AF | Role priority |
| AG–AO | Gap (self − required) |
| AP | Match Score % |
| AQ | Critical gap count |
| AR | Critical gap detail |
| AS | Readiness |
| AT | Meets threshold |
| AU | Alert Status (written by the Apps Script) |

**A1** — copy of the responses

> Google names the responses tab in your account's language, e.g. *Formularantworten 1* (German).
> Either rename that tab to `Form Responses 1` (the form keeps writing to it), or use its actual
> name in this formula. The Apps Script finds the tab either way.

```
=ARRAYFORMULA('Form Responses 1'!A1:N)
```

### A. Pull the baseline for the selected role
The key is `Role|Competency`; competency names come from the question titles in F1:N1.
`TRIM` removes stray spaces: Google Forms keeps a space typed at the end of a question title, and
without `TRIM` that competency would silently drop out of the score. Empty rows produce a key like `|Systems Thinking…` that isn't in Baseline_Master, so `IFERROR`
leaves them blank.

> **Keep every block the full 9 columns wide.** Don't wrap the 9-column blocks in
> `IF(E2:E = "", …)`. Sheets sizes an array `IF` result by its condition, so a one-column
> condition gives a one-column result and `VSTACK` fills the other 8 columns with `#N/A`.

**O1** — Required (O–W)
```
=ARRAYFORMULA(VSTACK("REQ · " & F1:N1,
  IFERROR(VLOOKUP(TRIM(E2:E) & "|" & TRIM(F1:N1), Baseline_Master!A:F, 5, FALSE))))
```

**X1** — Priority (X–AF)
```
=ARRAYFORMULA(VSTACK("PRI · " & F1:N1,
  IFERROR(VLOOKUP(TRIM(E2:E) & "|" & TRIM(F1:N1), Baseline_Master!A:F, 4, FALSE))))
```

### B. Gap = self score − required score
Negative means below the requirement.

**AG1**
```
=ARRAYFORMULA(VSTACK("GAP · " & F1:N1,
  IF((O2:W = "") + (F2:N = ""), , F2:N - O2:W)))
```

### C. Weighted Match Score %

**Match % = Σ weight × MIN(self, required) ÷ Σ weight × required**

- Scoring above the requirement earns no extra credit, so strengths can't hide gaps.
- A shortfall on a Critical competency costs 5× the same shortfall on a Low one.
- A competency with no required level contributes nothing to either side, so it's left out.

**AP1** — Match Score % (format the column as Percent)
```
=VSTACK("Match Score %", ARRAYFORMULA(LET(
  S, IFERROR(F2:N * 1, 0),
  R, IFERROR(O2:W * 1, 0),
  W, IFERROR(VLOOKUP(X2:AF, Weights!A:B, 2, FALSE), 0),
  ones, SEQUENCE(9, 1, 1, 0),
  earned,   MMULT(W * IF(S < R, S, R), ones),
  possible, MMULT(W * R, ones),
  IF(E2:E = "", , IF(possible = 0, "BASELINE MISSING", earned / possible)))))
```

**AQ1** — Critical gap count
```
=ARRAYFORMULA(VSTACK("Critical Gaps", LET(
  n, MMULT(IF((X2:AF = "Critical") * (AG2:AO < 0), 1, 0), SEQUENCE(9, 1, 1, 0)),
  IF(E2:E = "", , n))))
```

**AR1** — Critical gap detail
```
=VSTACK("Critical Gap Detail",
  MAP(E2:E, SEQUENCE(ROWS(E2:E)), LAMBDA(role, i,
    IF(role = "", "", ARRAYFORMULA(TEXTJOIN("; ", TRUE,
      IF((INDEX(X2:AF, i) = "Critical") * (INDEX(AG2:AO, i) < 0),
         F1:N1 & " (self " & INDEX(F2:N, i) & " vs req " & INDEX(O2:W, i) & ")", "")))))))
```

**AS1** — Readiness band
```
=ARRAYFORMULA(VSTACK("Readiness", IF(E2:E = "", ,
  IF(ISTEXT(AP2:AP), "Baseline Missing",
  IF((AP2:AP >= 0.9) * (AQ2:AQ = 0), "Ready Now",
  IF(AP2:AP >= 0.75, "Ready 1-2 Yrs", "Development Needed"))))))
```

**AT1** — Meets the role's threshold
```
=ARRAYFORMULA(VSTACK("Meets Threshold", IF(E2:E = "", ,
  IF(ISNUMBER(AP2:AP),
     IF(AP2:AP >= IFERROR(VLOOKUP(E2:E, Role_Map!A:C, 3, FALSE), 0.8), "Yes", "No"),
     "No"))))
```

**AU1** — type `Alert Status` (the script writes here).

### Worked example — Operations Manager

The maximum weighted total is 2·2 + 5·3 + 1·4 + 3·2 + 3·3 + 3·3 + 5·3 = **62**. The two competencies
with no required level are left out.

| Scenario | Score |
|---|---|
| Meets every requirement | 62/62 = **100%** |
| One level short on *Decisive Judgment* (Critical) | 57/62 = **91.9%** |
| One level short on *End-to-End Ownership* (Low) | 61/62 = **98.4%** |

---

## 5. `Candidate_Roster` (maintained by hand)

`A Candidate Name | B Email | C Discipline | D Target Role | E Hiring Manager | F Invited On (date) | G Manager Review (dropdown: Pending / Complete)`

You can start it from the *Successors* list in *Talent Review WS 2026*. Candidates are matched to
form submissions by **email**, or by **name** (not case-sensitive) when there's no email. If the form
doesn't collect emails, leave column B empty so both sides match by name.

## 6. `Dashboard_Feed` — cell A1 (the Looker Studio data source)

One row per candidate: everyone on the roster, plus anyone who submitted without being on it.
It uses each person's latest submission and works out the status. The first line says where the
responses keep Email and Name (`engMail, 2, engName, 3` = Email in B, Name in C). If your form put
**Name in B and Email in C**, change it to `engMail, 3, engName, 2`.

```
=ARRAYFORMULA(LET(
  engMail, 2, engName, 3,
  roster, IFERROR(FILTER(Candidate_Roster!A2:G, Candidate_Roster!A2:A <> "")),
  eng,    IFERROR(SORT(FILTER('Algorithm Engine'!A2:AT, 'Algorithm Engine'!A2:A <> ""), 1, FALSE)),
  rKey,   IFERROR(LOWER(TRIM(IF(CHOOSECOLS(roster, 2) <> "", CHOOSECOLS(roster, 2), CHOOSECOLS(roster, 1)))), ""),
  eKey,   IFERROR(LOWER(TRIM(IF(CHOOSECOLS(eng, engMail) <> "", CHOOSECOLS(eng, engMail), CHOOSECOLS(eng, engName)))), ""),
  keys,   SORT(UNIQUE(FILTER(VSTACK(rKey, eKey), VSTACK(rKey, eKey) <> ""))),
  R, LAMBDA(c, ARRAYFORMULA(IFERROR(VLOOKUP(keys, HSTACK(rKey, roster), c + 1, FALSE), ""))),
  E, LAMBDA(c, ARRAYFORMULA(IFERROR(VLOOKUP(keys, HSTACK(eKey, eng),    c + 1, FALSE), ""))),
  submitted, E(1),
  score,     E(42),
  status, IF(submitted = "", "Pending Self-Assessment",
          IF(R(7) = "Complete", "Evaluated", "Pending Manager Review")),
  VSTACK(
    {"Email","Candidate Name","Discipline","Role","Hiring Manager","Invited On","Evaluation Status",
     "Submitted On","Match Score","Critical Gaps","Readiness","Meets Threshold"},
    HSTACK(
      IF(R(2) <> "", R(2), E(engMail)),
      IF(R(1) <> "", R(1), E(engName)),
      IF(R(3) <> "", R(3), E(4)),
      IF(E(5) <> "", E(5), R(4)),
      R(5),
      IF(R(6) = "", "", TO_DATE(R(6))),
      status,
      IF(submitted = "", "", TO_DATE(submitted)),
      IF(ISNUMBER(score), score, ""),
      E(43), E(45), IF(E(46) = "", "No", E(46))))
))
```

`R(n)` = roster column *n*; `E(n)` = Algorithm Engine column *n* (1 Timestamp, 4 Discipline,
5 Role, 42 Match, 43 Critical Gaps, 45 Readiness, 46 Meets Threshold).
