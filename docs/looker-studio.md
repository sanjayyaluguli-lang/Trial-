# Looker Studio Dashboard

An illustrated version of these steps is in [`looker-visual-guide.html`](looker-visual-guide.html).

## 1. Data source prep

Point the dashboard at the **`Dashboard_Feed`** tab, not `Algorithm Engine`. The engine only holds
people who have *submitted*, so it can't show who is missing. `Dashboard_Feed` (see
[`sheets/formulas.md`](../sheets/formulas.md)) adds the two tracking columns the dashboard needs:

- **Evaluation Status:** Evaluated / Pending Manager Review / Pending Self-Assessment
- **Discipline**

### Connect

Looker Studio ▸ Create ▸ Data source ▸ **Google Sheets** ▸ *Competencie Baseline* ▸ `Dashboard_Feed`.
Tick "Use first row as headers" and Connect.

### Field types

| Field | Type |
|---|---|
| Match Score | Number ▸ **Percent** |
| Invited On | **Date** |
| Submitted On | **Date** |
| Critical Gaps | Number |

### Data source settings

- **Data freshness:** 15 minutes, the fastest option for Sheets. Viewers can force a refresh with
  ⋮ ▸ Refresh data.
- **Data credentials:** Owner's, so managers can view the dashboard without access to the sheet.

### Calculated fields

Add them in the data source so every chart can use them.

| Name | Formula |
|---|---|
| Is Submitted | `CASE WHEN Evaluation Status IN ("Evaluated","Pending Manager Review") THEN 1 ELSE 0 END` |
| Is Fully Evaluated | `CASE WHEN Evaluation Status = "Evaluated" THEN 1 ELSE 0 END` |
| Is Qualified | `CASE WHEN Meets Threshold = "Yes" THEN 1 ELSE 0 END` |
| Days Waiting | `DATE_DIFF(TODAY(), Invited On)` |

## 2. Scorecard: candidates evaluated

Insert ▸ **Scorecard** ▸ Metric **Is Submitted** (aggregation SUM) ▸ rename it "Candidates Evaluated".

Optional scorecards next to it:
- **Is Fully Evaluated**, for evaluations the manager has also reviewed
- **Record Count**, labelled "Candidates in Pipeline"

## 3. Bar chart: people meeting the threshold for each role

Insert ▸ **Column chart**, then set:
- **Dimension:** Role
- **Metric 1:** Is Qualified (SUM), renamed "Met Threshold"
- **Metric 2:** Is Submitted (SUM), renamed "Assessed", so each role shows qualified vs. assessed
- **Sort:** Met Threshold, descending
- **Style:** Show data labels on

Chief Engineer and Senior Principal TPM will show 0 qualified until their baselines are filled in.

## 4. Table: candidates missing an evaluation

Insert ▸ **Table**, then set:
- **Dimensions:** Candidate Name, Email, Role, Discipline, Hiring Manager, Evaluation Status, Invited On
- **Metric:** Days Waiting (MAX)
- **Filter:** Add filter ▸ *Include* ▸ Evaluation Status ▸ **In** ▸ `Pending Self-Assessment`, `Pending Manager Review`
- **Sort:** Days Waiting, descending
- **Style:** Conditional formatting with Days Waiting > 7 → red background

## 5. Donut chart: discipline breakdown

Insert ▸ **Donut chart**, then set:
- **Dimension:** Discipline
- **Metric:** Record Count (or `COUNT_DISTINCT(Email)`)
- **Style:** Slices = 6, labels = Percentage

For "submitted only", duplicate the chart and add a filter Is Submitted = 1.

## 6. Filters for the whole dashboard

Insert ▸ **Drop-down list**, then set:
- **Control field:** Role
- **Metric:** Record Count, so each option shows its count
- **Style:** Allow multiple selections on

Repeat for **Discipline**, and optionally for **Evaluation Status**.

Controls filter every chart on the page that uses the same data source. To make a control apply to
every page, right-click it ▸ **Make report-level**. For a date filter, add a Date range control and
set the data source's *Date Range Dimension* to **Submitted On**.
