# Role Competency Matching System

A self-assessment and role-matching pipeline built entirely in Google Workspace:
**Google Forms → Google Sheets → Apps Script → Google Chat → Looker Studio**.

1. A candidate rates themselves 1–4 on 9 competencies in a Google Form.
2. The response lands in `Form Responses 1` of the **Competencie Baseline** spreadsheet.
3. The `Algorithm Engine` tab looks up the chosen role's required levels and priorities. It then
   calculates each gap and a priority-weighted **Match Score %**.
4. An Apps Script `onFormSubmit` trigger posts a Chat card to the hiring manager. The card shows the
   candidate, role, match score and critical gaps, with a link to the row.
5. A Looker Studio dashboard reads `Dashboard_Feed` for pipeline and evaluation tracking.

## Repository contents

| Path | What it is |
|---|---|
| [`docs/form-layout.md`](docs/form-layout.md) | Google Form sections, routing question and question wording |
| [`sheets/formulas.md`](sheets/formulas.md) | Every helper tab and formula (`Role_Map`, `Weights`, `Baseline_Master`, `Algorithm Engine`, `Candidate_Roster`, `Dashboard_Feed`) |
| [`apps-script/Code.gs`](apps-script/Code.gs) | Form-submit alert to a Google Chat webhook, with an optional Gmail fallback |
| [`docs/looker-studio.md`](docs/looker-studio.md) | Dashboard data source, calculated fields and chart setup |
| [`docs/quickstart-personal-gmail.md`](docs/quickstart-personal-gmail.md) | Step-by-step test on a personal Gmail account (email alerts instead of Chat) |
| [`docs/visual-guide.html`](docs/visual-guide.html) | Illustrated version of the Gmail quick start with copy buttons (download and open in a browser) |

## Setup order

1. **Fix the baseline data** (see below).
2. Build the form per `docs/form-layout.md` and link it to the *Competencie Baseline* spreadsheet.
3. Create the helper tabs and paste the formulas from `sheets/formulas.md`.
4. Paste `apps-script/Code.gs` into Extensions ▸ Apps Script and set the `CHAT_WEBHOOK_URL`
   Script Property. Run `installTrigger` once, then run `testWithLastRow` with one dummy submission.
5. Build the dashboard per `docs/looker-studio.md`.

## Scoring model

```
Match % = Σ weight × MIN(self, required) ÷ Σ weight × required
weights: Critical 5 · High 3 · Medium 2 · Low 1   (editable in the Weights tab)
```

- Scoring above the requirement earns no extra credit, so strengths can't hide gaps.
- A Critical shortfall costs 5× a Low one.
- **Readiness:**
  - *Ready Now*: ≥ 90% and no Critical gaps
  - *Ready 1-2 Yrs*: ≥ 75%
  - *Development Needed*: below 75%
- **Meets Threshold:** the score is at least the per-role threshold in `Role_Map` (default 80%).

## Known problems in the source baseline

| Problem | Effect | How the build handles it |
|---|---|---|
| **Matrix Chief Engineer** and **Matrix Senior Principle TPM** have no Role Priority or Required Proficiency filled in | Candidates for those roles can't get a score | The engine shows `BASELINE MISSING` instead of a wrong number. Fill in these tabs before going live. |
| **Matrix Ops Manager** has no Required Proficiency for *Cross-Functional Communication* and *Domain Mastery* | Those two competencies can't be scored | They're left out of the Ops Manager score until you fill them in |
| Required Proficiency is text (`"3 - Proficient …"`), and the header says "(1–3)" even though values go up to 4 | A plain lookup would return text, not a number | The formula reads only the first character as the number. Fix the header. |
| Priority is written as `Medium`, not `Med`. The Chief Engineer tab uses a different scale wording (Skilled/Experienced/Master). | Lookups could miss, and candidates and managers may read the levels differently | The weight table accepts both `Med` and `Medium`. Use one scale wording across all tabs. |

## Status

The formulas, script and dashboard steps have not yet been tested in a live Google Workspace
account. Before rollout, check everything end to end with one dummy submission.
