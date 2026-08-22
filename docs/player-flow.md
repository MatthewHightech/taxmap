# TaxMap — Player Year Flow (Student)

Educational simulation only — not tax advice.

---

## 0. Pre-game: Character select

Show three personas; **only Student is playable** in MVP.

| Persona | Status | Pitch (1 line) |
|---------|--------|----------------|
| **University Student** | Playable | First real income, tuition, and registered accounts |
| **Single Mother of 2** | Locked | “Coming soon” — benefits, childcare, working-income trade-offs |
| **Retired Fisherman (boat debt)** | Locked | “Coming soon” — pension, debt interest, capital gains on gear |

**On Student select → briefing modal**, then create playthrough → `/play`.

### Student briefing modal (copy targets)

- **Goal:** Survive a school year of money choices, then file taxes in Spring.
- **How to play:** Walk with WASD, enter buildings with Spacebar / click, pick trade-offs.
- **Starting conditions (Student):**
  - Gross salary: **$12,000 / year** (~$1,000 / month before tax)
  - Starting cash: **~$2,200** (tuneable)
  - Student debt: optional / starts low until Fall loans
  - Withholding: game applies a simplified federal withhold on pay
- Disclaimer: illustrative federal tax only.

---

## 1. Season map

| ID (code) | UI label | Theme | Locations |
|-----------|----------|-------|-----------|
| `may` | **Summer** | Living costs + first banking | Home, Car, Bank |
| `september` | **Fall** | School costs | University, Grocery |
| `january` | **Winter** | Income, liquidity, audit lessons | Home, Car, Bank *(or Grocery)* |
| `april` | **Spring · Tax Day** | File return | Tax Office |

Advance: complete required visits **or** HUD **Next →** (demo).

---

## 2. Summer (`may`)

### Home — rent & utilities
- Pay **rent $800 / month** (Summer beat = 1–3 months lump or single “summer rent” decision — recommend **one card: pay $800 rent + utilities bundle** for speed, with options):
  - Pay full rent + utilities now
  - Pay rent only, skip utilities (late fee / audit-ish stress flag later? better: cash buffer hit later)
  - Split with roommate (lower cash out)

### Car — gas & maintenance
- **$300** gas + maintenance package
  - Pay in full
  - Defer maintenance (risk flag → Winter car emergency costs more)
  - Bike / transit instead (save cash, lose convenience flag)

### Bank — multi-option (one visit, multi-select or stepped choices)
Prefer **one Bank visit** with clear branches (or 2 cards if needed):

1. **Open accounts** (pick one primary for MVP):
   - High-interest savings (HISA) — liquid
   - TFSA — growth, tax-free (flag `has_tfsa`)
   - RRSP — deduction later (flag `has_rrsp`)
   - FHSA — first home, deduction + tax-free growth vibe (flag `has_fhsa`)
2. **Take out a loan** — cash now, debt + interest
3. **Buy a GIC** — lock cash, higher stub interest, **hurts Winter liquidity**

Ledger effects must set flags so Winter / Spring filing can reference accounts opened.

---

## 3. Fall (`september`)

### University
- **Select number of courses** (e.g. 3 / 4 / 5)
- **Tuition = $600 × courses**
- Pay with:
  - Cash / savings
  - **Student loan** (cash covered, debt up, education credit/tuition amount tracked for Spring)
- Track `courses`, `tuitionPaid`, `credits` (tuition tax credit approx)

### Grocery
- Monthly-style grocery dilemma (needs vs wants)
- Ties to cash buffer after tuition shock

### Bank — **fund an account** (moved here from Winter)
- Contribute $500 to RRSP / FHSA / TFSA / HISA, or keep cash liquid
- RRSP & FHSA add **deductions** for Spring filing
- TFSA grows tax-free (no immediate deduction)
- HISA stays liquid with a small interest stub

---

## 4. Winter (`january`)

1. **Car — Emergency expense** (battery / tires / transit)
2. **Grocery — Side gig tips** (report vs hide)
3. **Home — Fake deduction trap**

---

## 5. Spring (`april`)

- Only **Tax Office** (Home optional)
- Sidebar filing wizard (Income → Deductions → Credits → Review → File)
- Audit if risk &gt; 0
- Results + score + Play Again

Pull from ledger: employment ($12k prorated by what was “received” in play), reported/unreported side income, RRSP/FHSA deductions, tuition credits, withholdings, investments.

---

## 6. Economy constants (Student MVP)

| Constant | Value |
|----------|-------|
| Annual salary | $12,000 |
| Summer rent (card) | $800 |
| Car upkeep (card) | $300 |
| Tuition per course | $600 |
| Courses options | 3 / 4 / 5 |
| Starting cash | $2,200 (tune) |

Pay can be applied as: Summer start deposit of YTD wages so far, or monthly stubs at each season — **recommend**: grant **~$7,500** employment income + proportional withholdings across Summer→Winter so Spring has a real T4-like total without 12 micro-pays.

---

## 7. UX flow diagram

```
Landing
  → Character Select (Student only)
  → Briefing Modal (salary, how to play, disclaimer)
  → Town · Summer (Home, Car, Bank)
  → Town · Fall (University, Grocery)
  → Town · Winter (Emergency, Fund account, Side gig)
  → Town · Spring (Tax Office → Wizard → Audit → Results)
```

---

## 8. Implementation notes (when building)

1. Character select page or modal on `/` before `createPlaythrough`
2. Persist `persona: "student"` (already on schema); add locked personas in UI only
3. Rewrite `SEASON_LABELS` / `SEASON_LOCATIONS` / scenarios to match this doc
4. Bank Summer: multi-option modal (not three separate buildings)
5. University Fall: course count → tuition math in option effects or dedicated mutation
6. Seed demo jumps to Spring with a messy student ledger
