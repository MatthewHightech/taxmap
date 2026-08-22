# TaxMap — Requirements (Hackathon MVP)

**Event:** [Cursor Codechella @ Victoria, BC](https://luma.com/cursorvictoria?tk=PQb1bw)  
**Prize focus:** Best project built with Convex  
**Timebox:** ~7 hours to a demoable, deployable build  
**Team:** Solo  

---

## 1. Product summary

TaxMap is a **solo, turn-based web game** that teaches Canadian personal tax and money basics through a cozy isometric town. The player is a **student** who moves between landmarks, resolves short financial dilemmas, and finishes at the Tax Office with a **TurboTax / Wealthsimple–style filing wizard**, an audit check, and a scored results screen.

This is **educational simulation**, not tax advice. A short disclaimer appears on start and on the filing review step.

---

## 2. Goals for today

### Must ship (demo-critical)

1. Playable student run from start → filing → results in under ~3 minutes of demo time (with optional skip/seed).
2. Interactive town map with clickable landmarks and walking character.
3. Live HUD: cash, net worth, deductions/credits summary, audit risk.
4. **8–12** drafted dilemma cards across the campaign (editable copy).
5. Month-12-style climax: sidebar filing wizard + audit + refund/balance owing + score + Play Again.
6. **Persisted game state in Convex** that survives refresh (anonymous playthrough ID in `localStorage`).
7. Deployed: **Render** (web) + **Convex Cloud** (backend).

### Nice if time

- Auth (Clerk / Convex Auth) layered on the same playthrough model.
- Richer sprite direction handling / idle pose polish.
- Seeded “judge demo” button that jumps to Tax Season with a prepared ledger.
- Light motion polish on HUD and filing stamp.

### Explicit non-goals (v1)

- Multiplayer, spectating, leaderboards.
- Provincial (BC) tax — **federal only**.
- Sound / music.
- Mobile-first layout (desktop demo only; must not be broken on laptop).
- Perfect CRA accuracy or real e-file.
- Full 12 monthly turns with unique art per month.

---

## 3. Player & campaign structure

### Persona

- **Student** (young adult / undergrad).
- Starting cash, paycheck, tuition, and loan numbers are **placeholders** tunable later; economy must be data-driven so copy and balances can change without code rewrites.

### Campaign shape (MVP “year”)

Not 12 separate months. Four **season beats** that represent a school year:

| Beat | Label (UI) | Role |
|------|------------|------|
| 1 | **May** | Summer start — income, spending, first money choices |
| 2 | **September** | Back to school — tuition, student loans, education credits |
| 3 | **January** | Mid-year money — work, gigs, savings/investments |
| 4 | **April (Tax Day)** | File at Tax Office — wizard, audit, results |

Within beats 1–3, some turns expose **2–3 open locations**; others may expose 1. Total interactive decisions for MVP: **8–12 cards**.

Tax Office is **locked** until April (or until a demo “Skip to Tax Season” action unlocks it).

---

## 4. Core loop

1. Player sees town + HUD + current season beat.
2. Available landmarks highlight; others are dimmed/disabled.
3. Player clicks a landmark → character walks there → decision modal opens.
4. Player picks an option (trade-offs shown **before** confirm).
5. Convex mutation applies ledger deltas (cash, income buckets, deductions, credits, audit risk, flags).
6. Repeat until the beat’s required decisions are done → advance season.
7. April: only Tax Office (and maybe Home for flavor) → filing wizard → audit → results → Play Again.

---

## 5. Map & landmarks

**Assets (in repo):**

- `public/assets/town.png` (4096×4096) — primary map render for performance.
- `public/assets/town.svg` (4096×4096) — available if vector hotspots help later; **MVP defines hotspots in code**.
- `public/assets/sprite_sheet.png` (2048×2048) — student walk cycle (validate frame grid in implementation).

**Landmarks for hotspots:**

| ID | Building | Typical scenarios |
|----|----------|-------------------|
| `grocery` | Grocery | Budgeting, necessities vs wants, emergency buffer |
| `bank` | Bank | Savings, GIC/liquidity trade-off, TFSA/RRSP intro (simplified) |
| `university` | University (map may show Library / campus building — map to closest labeled building) | Tuition, loans, education tax credits |
| `taxOffice` | Tax Office | Filing only (April / unlocked) |
| `home` | Home | Rent/utilities, lifestyle, “life happens” expenses |
| `car` | Car | Transport costs, insurance, commuting trade-offs |

Hotspots are **percentage-based bounding boxes** over the map image so layout stays stable when scaled.

---

## 6. Player metrics (HUD)

| Metric | Meaning |
|--------|---------|
| **Cash** | Liquid money |
| **Net Worth** | Cash + investments − debt (simplified) |
| **Deductions** | Accumulated amounts that reduce taxable income |
| **Credits** | Accumulated amounts that reduce tax owing ($) |
| **Audit Risk** | 0–100% bar; rises with shady choices (unreported cash, aggressive claims) |

Optional secondary (if space): season label, reported vs unreported income hint.

All metrics update from **server state** (Convex), not only client local math.

---

## 7. Dilemma design rules

- **Trade-offs over trivia** — every card has 2–3 options with clear cash/tax/risk consequences.
- Show **preview chips** before confirm (e.g. `Cash −$400`, `Credit +$120`, `Audit +8%`).
- Teach: reportable vs non-reportable income; deductions vs credits; liquidity vs return.
- Copy drafted in code/content files; easy for owner to edit.

**Must-include themes (across the 8–12 cards):**

1. Tuition / education credit  
2. Student loan or repayment pressure  
3. Paycheque / withholding basics  
4. Side gig cash — report vs hide  
5. Grocery / budget emergency  
6. Savings or locked product (liquidity lesson)  
7. At least one “looks deductible but isn’t” trap  
8. Path into April filing with a messy-but-fair ledger  

---

## 8. Tax season (April)

### Filing UX (required feel)

**Sidebar step wizard** inspired by TurboTax / Wealthsimple Tax:

1. **Income** — employment, reported gigs, investment income  
2. **Deductions** — RRSP/tuition-related deductions as modeled  
3. **Credits** — tuition/education-style credits as modeled  
4. **Review** — taxable income, federal tax estimate, withholdings, refund vs balance  
5. **File** — confirm + disclaimer  

Then:

6. **Audit roulette** if audit risk &gt; 0% (dramatized but fast for demo).  
7. **Results** — stamp (REFUND / BALANCE OWING), score, badges, narrative blurb, **Play Again**.

### Tax model (MVP)

- **Canadian federal only**, **roughly realistic** brackets for a recent tax year (constants in one module).
- Simplified gross-up of withholdings vs tax calculated.
- Unreported income: excluded from honest filing totals but can be discovered on failed audit → back-tax + penalty → score hit.
- Numbers need not be CRA-perfect; they must feel coherent and educational.

### Scoring (results screen)

Simple deterministic score from:

- Final net worth  
- Refund vs balance (contextual, not “refund always good”)  
- Audit outcome  
- “Tax savvy” flags (reported income, claimed eligible credits, avoided fake deductions)

Play Again creates a **new** playthrough (new Convex doc + new local ID).

---

## 9. Persistence & auth

### MVP

- Guest play.
- On first visit, client creates a playthrough via Convex mutation; stores `playthroughId` in `localStorage`.
- Refresh reloads the same run from Convex.
- No account required.

### Later (out of scope unless spare time)

- Auth; attach `userId` to playthrough; keep anonymous migration path.

---

## 10. Demo requirements (3 minutes)

Demo path must be reliable:

1. Land on town with readable brand + HUD.  
2. Complete **1–2** lively decisions (show walk + modal + HUD update).  
3. Jump to April (seeded state or Skip) if needed.  
4. Run filing sidebar → File → audit beat → results stamp.  

Optional: **“Judge Demo”** preset that loads a mid/high audit-risk ledger so the climax is interesting.

---

## 11. Technical requirements

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router) + React + Tailwind |
| Backend | Convex (schema, queries, mutations; auth later) |
| Hosting | Render (web) + Convex Cloud |
| Desktop-first | Target 1280×720+ for live demo |

### Convex must own

- Playthrough document (season, open locations, ledger, flags, completed card IDs).  
- Applying choice outcomes.  
- Computing filing summary / audit roll / score from stored ledger.  

Client may animate and preview; **source of truth is Convex**.

### Content

- Scenarios as typed data (`id`, location, season, title, body, options[], effects).  
- No hard-coded story branches buried only in UI components.

---

## 12. UI / brand requirements

- **Feel:** Gamified HUD like Clash of Clans (chunky panels, resource chips, clear CTAs) + cozy cartoon town.  
- **Primary:** dark green finance palette; warm town art stays the hero.  
- **Not:** purple SaaS gradients, dense newspaper layout, card spam in the hero/map view.  
- Map is the main surface; modals/wizard overlay when deciding or filing.  
- Educational tone: friendly, clear, slightly witty; never shame-heavy.

---

## 13. Acceptance criteria (MVP done)

- [ ] Fresh browser can start a run and resume after refresh.  
- [ ] All six hotspot types are clickable when unlocked.  
- [ ] Character walks to destination before modal opens.  
- [ ] ≥8 dilemma cards playable with previewable effects.  
- [ ] Season advances May → Sept → Jan → April.  
- [ ] April opens sidebar filing wizard with steps listed above.  
- [ ] Audit runs when risk &gt; 0; clean path when risk = 0.  
- [ ] Results show stamp, score, Play Again.  
- [ ] App deployed on Render; Convex production/dev deployment wired.  
- [ ] Disclaimer visible; no claim of real tax filing.  

---

## 14. Open items (owner will tune later)

- Exact starting cash / income / tuition dollar amounts.  
- Final federal bracket table year + constants.  
- Precise map hotspot coordinates (calibrate on `town.png`).  
- Sprite sheet frame grid / whether true 8-direction exists vs flip from one facing.  
- Final scenario copy edits.  
- Auth provider choice if added post-MVP.  
