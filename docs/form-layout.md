# Google Form Layout

The nine competencies are the same on every role tab; only the priority and required level change
by role. So the form has **one set of 9 questions** for every role. The role choice sends the
candidate to a short role introduction page, and everyone then answers the same questions.
Separate question sets per role would scatter the answers across 45 columns.

## Form settings

- **Collect email addresses:** Verified.
- **Allow response editing:** Off. An edit rewrites the same answer row and would break the
  duplicate-alert check.
- **Responses ▸ Link to Sheets ▸ Select existing** ▸ *Competencie Baseline*, so everything lives in
  one file.

## Sections

| # | Section | Contents |
|---|---|---|
| 1 | **Candidate Profile & Target Role** | Description: the 4-point scale (below). **Q1** Full Name (short answer, required). **Q2** Discipline (dropdown: Engineering / Program & Project Mgmt / Operations / Quality / Other). **Q3, the routing question:** *"Which role are you being assessed for?"* (Multiple choice, required: `Operations Manager`, `Senior PM`, `Chief Engineer`, `Senior Principal TPM`, `Quality Lead`). ⋮ ▸ **Go to section based on answer** → sections 2A–2E |
| 2A–2E | **Role introduction** (one per role, text only, no questions) | 2–3 lines on what the role focuses on. **Don't show the required levels**, because candidates will anchor their answers to them. At the bottom of each: *After section → Continue to Section 3* (you must set this on 2A–2D, or they will fall through to the next role's page) |
| 3 | 1. Strategic & Analytical Thinking | Systems Thinking & Business Alignment · Decisive Judgment under Ambiguity |
| 4 | 2. Delivery & Execution Excellence | End-to-End Ownership · Agile Planning & Resource Management |
| 5 | 3. Leadership & Influence | Influencing Without Authority · Conflict Resolution & Negotiation |
| 6 | 4. Communication & Collaboration | Cross-Functional Communication |
| 7 | 5. Resilience & Adaptability | Continuous Learning & Agility |
| 8 | 6. Functional / Technical Expertise | Domain Mastery & Application |
| 9 | Evidence & Submit | Optional paragraph: *"Give one concrete example (last 12 months) that best supports your highest rating."* |

## Two rules the formulas depend on

1. All 9 rating questions are **Linear scale 1–4**. Each **title must exactly match** the Core
   Competency name in the baseline. Put the explanatory text in the description, never in the title.
2. Keep the order above. It produces this `Form Responses 1` layout:
   `A Timestamp | B Email | C Full Name | D Discipline | E Role | F–N the 9 ratings | O Evidence`.

## Scale text for the Section 1 description

(from the *Scale Explanation for Evaluation* tab)

> 1 = Skill missing · 2 = Shows it under ideal conditions, not under stress ·
> 3 = Shows it in about 80% of cases, including most high-pressure ones · 4 = Outstanding; a benchmark for others

## Example question

> **Title:** `Decisive Judgment under Ambiguity`
>
> **Description:**
> *Makes timely, high-quality decisions even when data is incomplete or changing rapidly.*
> Think about the last 12 months. How consistently did you:
> • take calculated risks, with clear plans to limit the downside?
> • prioritize critical-path items under tight deadlines?
> • avoid analysis paralysis by making the call with the facts available?
> *Rate yourself on what you actually did, not what you'd like to do.*
>
> **Linear scale:** 1 → 4 · Label for 1: `Skill missing` · Label for 4: `Benchmark strength` · Required ✔

Use the same pattern for the other eight: definition in italics, then the Observable On-the-Job
Indicators from the baseline turned into "How consistently did you…" bullets.
