# Candidate Profile tab — spider chart per candidate

A tab with a candidate picker (cell **B1**) and a radar (spider) chart comparing the role
requirement with the candidate's self-ratings on the 9 competencies. Picking another name redraws
the chart. It reads the candidate's latest submission from `Algorithm Engine`.

## Recommended: let the script build it

1. **Extensions ▸ Apps Script**, paste the current [`apps-script/Code.gs`](../apps-script/Code.gs),
   keeping your own `EMAIL_FALLBACK_TO` and `EMAIL`/`NAME` column numbers. Click **Save**.
2. Pick **`buildProfileTab`** in the function dropdown ▸ **Run**.
3. The **Candidate Profile** tab opens with the latest candidate selected. Change **B1** to see
   someone else.

Running it again rebuilds the tab from scratch. The script writes formulas in standard syntax,
which works in every locale, including European ones.

## Layout

| Cell | Content |
|---|---|
| B1 | Candidate picker (dropdown of names from the Algorithm Engine) |
| B2 | Engine row of that candidate's latest submission |
| B3–B6 | Role, Match Score, Readiness, Critical gaps |
| A8:E17 | Competency · Role requirement · Candidate · Priority · Gap |
| Chart | Radar of A8:C17, scale 0–4 |

## Manual alternative (European syntax, Name in column B of the engine)

For Name in column C, replace `B2:B` with `C2:C` in B2.

| Cell | Formula |
|---|---|
| B1 | Data ▸ Data validation ▸ Dropdown (from a range) ▸ `'Algorithm Engine'!B2:B` |
| B2 | `=MAX(FILTER(ROW('Algorithm Engine'!B2:B); 'Algorithm Engine'!B2:B = B1))` |
| B3 | `=IFERROR(INDEX('Algorithm Engine'!E:E; B2))` |
| B4 | `=IFERROR(INDEX('Algorithm Engine'!AP:AP; B2))` (format as percent) |
| B5 | `=IFERROR(INDEX('Algorithm Engine'!AS:AS; B2))` |
| B6 | `=IFERROR(INDEX('Algorithm Engine'!AQ:AQ; B2))` |
| A8:E8 | Type `Competency`, `Role requirement`, `Candidate`, `Priority`, `Gap` |
| A9 | `=ARRAYFORMULA(TRIM(TRANSPOSE('Algorithm Engine'!F1:N1)))` |
| B9 | `=IFERROR(TRANSPOSE(INDEX('Algorithm Engine'!O:W; $B$2)))` |
| C9 | `=IFERROR(TRANSPOSE(INDEX('Algorithm Engine'!F:N; $B$2)))` |
| D9 | `=IFERROR(TRANSPOSE(INDEX('Algorithm Engine'!X:AF; $B$2)))` |
| E9 | `=IFERROR(TRANSPOSE(INDEX('Algorithm Engine'!AG:AO; $B$2)))` |

Then select **A8:C17** ▸ **Insert ▸ Chart** ▸ Chart type **Radar chart**. In **Customise ▸
Vertical axis**, set Min `0` and Max `4`. Series colours: Role requirement `#17313B`, Candidate
`#00896B`.
