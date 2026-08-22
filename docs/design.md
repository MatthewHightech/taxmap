# TaxMap — Design (Hackathon MVP)

Companion to [`requirements.md`](./requirements.md). Optimized for a **~7 hour** build: deep modules, thin UI, Convex as source of truth.

---

## 1. Design principles

1. **One composition on launch** — town map + brand + HUD; no dashboard collage.
2. **Server ledger, client theatre** — Convex stores truth; React animates walks, modals, stamps.
3. **Content as data** — scenarios and tax constants are modules, not JSX prose.
4. **Demo-first paths** — Skip / seed without forking game rules.
5. **Deep modules** — hide tax math, hotspot math, and scenario application behind small APIs.

---

## 2. Visual direction

### Brand & atmosphere

- **Hero:** isometric town (`town.png`) full-bleed in the play viewport.
- **UI chrome:** Clash-of-Clans–adjacent resource bar — thick borders, soft inset panels, high-contrast numbers, green primary.
- **Tone:** cozy cartoon + “serious money” green, not fintech purple or tax-form grey.

### Color tokens (proposed CSS variables)

```css
:root {
  --tm-green-900: #0b3d2e;
  --tm-green-700: #145c43;
  --tm-green-500: #1f7a56;
  --tm-green-300: #6fbf9a;
  --tm-cream: #e8f0e9;
  --tm-gold: #e2b84a;      /* refund / reward accent */
  --tm-danger: #c44b3c;    /* audit / owing */
  --tm-ink: #14201b;
  --tm-panel: rgba(11, 61, 46, 0.92);
}
```

### Typography

- **UI / HUD:** distinctive rounded sans (e.g. Nunito or Fredoka) — gamey, readable.
- **Filing wizard:** slightly more “product” sans (e.g. Source Sans 3 or IBM Plex Sans) to evoke Wealthsimple/TurboTax trust.
- Avoid Inter/Roboto/system as the only voice.

### Motion (2–3 intentional)

1. Character walk cycle + easing toward hotspot.  
2. HUD number tick / bar fill on audit risk.  
3. Filing stamp slam (REFUND / BALANCE OWING).  

No particle spam.

### Layout (desktop-first)

```
┌──────────────────────────────────────────────────────────┐
│  TAXMAP          [Cash] [Net Worth] [Ded] [Credits] [⚠%] │
│  May · Summer                                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                   TOWN MAP (full area)                   │
│              hotspots + walking sprite                   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Hint: Visit University · 2 choices left this season     │
└──────────────────────────────────────────────────────────┘
```

Overlays: decision modal (center), filing wizard (full-height sidebar + main pane), results (full screen takeover).

---

## 3. Architecture overview

```
┌─────────────────────┐     Convex      ┌──────────────────────┐
│  Next.js (Render)   │◄───────────────►│  playthroughs table  │
│  Map / HUD / Modals │   queries/muts  │  ledger + progress   │
└─────────────────────┘                 └──────────────────────┘
         │
         ▼
  localStorage: playthroughId
```

### Suggested folder layout

```
app/
  page.tsx                 # landing → start / resume
  play/page.tsx            # game shell
  layout.tsx
components/
  game/
    TownMap.tsx            # image + hotspots + sprite
    Hud.tsx
    DecisionModal.tsx
    FilingWizard.tsx       # sidebar steps
    ResultsScreen.tsx
  ui/                      # buttons, panels, meters
convex/
  schema.ts
  playthroughs.ts          # create, get, choose, advance, file, reset
  lib/
    ledger.ts              # apply effects, derived totals
    taxFederal.ts          # brackets + compute return
    audit.ts               # risk → roll → penalties
    scoring.ts
content/
  scenarios.ts             # 8–12 cards
public/assets/
  town.png
  town.svg
  sprite_sheet.png
docs/
  requirements.md
  design.md
```

**Deep modules (keep logic out of components):**

| Module | Responsibility |
|--------|----------------|
| `ledger.ts` | Apply `Effect`, derive HUD fields |
| `taxFederal.ts` | Taxable income → federal tax → refund/owing |
| `audit.ts` | Risk threshold, RNG/seeded roll, penalties |
| `scoring.ts` | Results score + badges |
| `scenarios.ts` | Content only |
| `hotspots.ts` | Landmark boxes in % of map |

---

## 4. Convex data model

### Table: `playthroughs`

```ts
playthroughs: defineTable({
  createdAt: v.number(),
  updatedAt: v.number(),
  // Progress
  season: v.union(
    v.literal("may"),
    v.literal("september"),
    v.literal("january"),
    v.literal("april"),
  ),
  status: v.union(
    v.literal("playing"),
    v.literal("filing"),
    v.literal("complete"),
  ),
  completedScenarioIds: v.array(v.string()),
  unlockedLocationIds: v.array(v.string()),
  // Persona (fixed for MVP)
  persona: v.literal("student"),
  playerName: v.optional(v.string()),
  // Ledger (cents or dollars — pick dollars for hackathon clarity)
  cash: v.number(),
  investments: v.number(),
  debt: v.number(),
  employmentIncome: v.number(),
  reportedSideIncome: v.number(),
  unreportedSideIncome: v.number(),
  investmentIncome: v.number(),
  withholdings: v.number(),
  deductions: v.number(),
  credits: v.number(),
  auditRisk: v.number(), // 0–100
  flags: v.array(v.string()), // e.g. "claimed_fake_books", "reported_tips"
  // Finale
  filingSnapshot: v.optional(v.any()), // freeze computed return for results
  auditResult: v.optional(v.union(
    v.literal("none"),
    v.literal("passed"),
    v.literal("failed"),
  )),
  score: v.optional(v.number()),
  // Optional later
  userId: v.optional(v.string()),
})
.index("by_creation", ["createdAt"]);
```

Prefer tightening `filingSnapshot` with a typed object validator before ship if time allows (avoid unbounded `v.any()` in production habits; acceptable only as last-minute hackathon glue).

### Public API (thin wrappers)

| Function | Type | Purpose |
|----------|------|---------|
| `createPlaythrough` | mutation | New run; return id |
| `getPlaythrough` | query | Resume by id |
| `listOpenScenarios` | query | Scenarios available for current season − completed |
| `chooseOption` | mutation | Validate scenario/option → apply effects → maybe unlock/advance |
| `advanceSeason` | mutation | If beat complete; or auto-advance inside `chooseOption` |
| `startFiling` | mutation | `season===april` → `status: filing` |
| `submitReturn` | mutation | Compute tax, run audit, set score, `complete` |
| `resetPlaythrough` | mutation | Or just create new + client swaps localStorage |

**Auth:** none for MVP. Do not trust client-sent ledger patches — only accept `scenarioId` + `optionId`.

---

## 5. Game progression design

### Season gates

| Season | Open locations (example) | Cards target |
|--------|--------------------------|--------------|
| May | home, grocery, car | 2–3 |
| September | university, bank, grocery | 3–4 |
| January | bank, home, car *(gig can live at grocery/home)* | 2–3 |
| April | taxOffice (+ home optional) | filing only |

Exact open set lives in `content/seasons.ts` so tuning is one file.

**Advance rule:** when required count of scenarios for the season is completed (or all available completed), auto-advance with a short “Season complete” toast, then unlock next beat’s locations.

### Character movement

1. Click hotspot → if locked, shake/tooltip.  
2. If unlocked and scenario available → animate sprite along a **simple polyline** (start → 1–2 waypoints on streets → destination).  
3. On arrival → open `DecisionModal`.  
4. If April / taxOffice → open `FilingWizard` instead.

**Sprite sheet:** `sprite_sheet.png` is 2048×2048. Implementation step 0: slice frames (likely walk cycle; confirm grid). For MVP, **one facing + CSS scaleX flip** is enough if true 8-dir frames are missing. Idle = first frame.

---

## 6. Hotspot system

Define landmarks in normalized coordinates (0–100% of map width/height):

```ts
export const HOTSPOTS = {
  grocery:    { id: "grocery",    label: "Grocery",    x: 28, y: 42, w: 8, h: 10 },
  bank:       { id: "bank",       label: "Bank",       x: 48, y: 28, w: 8, h: 10 },
  university: { id: "university", label: "University", x: 78, y: 45, w: 10, h: 12 },
  taxOffice:  { id: "taxOffice",  label: "Tax Office", x: 62, y: 40, w: 10, h: 10 },
  home:       { id: "home",       label: "Home",       x: 40, y: 62, w: 8, h: 10 },
  car:        { id: "car",        label: "Car",        x: 38, y: 68, w: 6, h: 6 },
} as const;
```

Calibrate visually against `town.png` (Library → University mapping; car near home driveway). Use a temporary debug outline mode (`?debugHotspots=1`) during build day.

Render: `<img src="/assets/town.png">` + absolutely positioned buttons. Prefer PNG over huge SVG for runtime cost; keep SVG in repo for future tracing.

---

## 7. Decision modal UX

Clash-meets-lesson card:

- Location icon + season chip  
- Title + 2–4 sentence body  
- 2–3 option buttons; each shows **effect preview chips**  
- Confirm / Cancel (cancel does not spend the visit if we want softer UX — MVP: choosing opens confirm; cancel closes without applying)

Effects schema:

```ts
type Effect = {
  cash?: number;
  investments?: number;
  debt?: number;
  employmentIncome?: number;
  reportedSideIncome?: number;
  unreportedSideIncome?: number;
  investmentIncome?: number;
  withholdings?: number;
  deductions?: number;
  credits?: number;
  auditRisk?: number; // delta
  addFlags?: string[];
  removeFlags?: string[];
};
```

---

## 8. Filing wizard UX (TurboTax / Wealthsimple feel)

**Layout:** left sticky sidebar (steps), right content pane, bottom primary CTA.

| Step | Content |
|------|---------|
| Income | Line items from ledger; toggle help text (“Why this counts”) |
| Deductions | Listed claimed deductions; warn on suspicious flags |
| Credits | Tuition-style credits |
| Review | Math stack: Gross → − deductions → taxable → federal tax − withholdings − credits → **Refund / Owing** |
| File | Disclaimer + big File button |

Visual language: clean rows, muted borders, green primary button, progress checkmarks in sidebar — **less game chrome here**, more product UI, then slam back to gamey stamp on results.

### Audit

- If `auditRisk === 0` → skip to “Clean record” micro-beat.  
- Else show short roulette / meter animation → pass/fail from server (`Math.random` in mutation is OK for MVP; optionally pass client entropy).  
- Fail: add penalty to cash/owing; reveal unreported income in narrative.

### Results

- Big stamp  
- Score (0–100 or 0–1000)  
- 2–4 badges (“Reported your tips”, “Liquidity legend”, “Audit dodger” / “Caught”)  
- Play Again → `createPlaythrough` + replace localStorage id → route refresh  

---

## 9. Federal tax module (sketch)

```ts
// taxFederal.ts — single place for brackets
computeFederalReturn(input: {
  employmentIncome: number;
  reportedSideIncome: number;
  investmentIncome: number;
  deductions: number;
  credits: number;
  withholdings: number;
}): {
  grossIncome: number;
  taxableIncome: number;
  federalTax: number;
  netTax: number;      // after credits
  balance: number;     // positive = owing, negative = refund
}
```

Use simplified 2025-ish federal brackets in constants; document year in a comment. Basic personal amount can be a flat credit approximation for MVP.

---

## 10. Scenario content plan (draft targets)

Aim for **10 cards** (within 8–12):

| ID | Season | Location | Lesson |
|----|--------|----------|--------|
| `may-grocery-budget` | May | grocery | Needs vs wants + cash buffer |
| `may-car-insurance` | May | car | Fixed costs eat cash |
| `may-home-roommate` | May | home | Shared costs / lifestyle |
| `sept-uni-tuition` | Sept | university | Tuition + education credit |
| `sept-uni-loan` | Sept | university | Debt vs cash-flow |
| `sept-bank-save` | Sept | bank | TFSA/savings vs spending |
| `jan-side-gig` | Jan | grocery or home | Report tips vs mattress cash |
| `jan-bank-gic` | Jan | bank | Locked return vs liquidity |
| `jan-fake-deduction` | Jan | home | Books/“business” trap → audit risk |
| `jan-withholding` | Jan | home/office-as-home | Bonus/withholding surprise |

Copy drafted in `content/scenarios.ts` for owner edit.

---

## 11. Client state machine

```
boot → read localStorage id
  → missing → createPlaythrough → save id → playing
  → present → getPlaythrough
       → complete → ResultsScreen
       → filing → FilingWizard
       → playing → TownMap
```

Local UI-only state: sprite position, modal open, wizard step index, walk animation. Never store ledger locally as authority.

---

## 12. Demo mode (3 minutes)

`?demo=1` or HUD button **Judge Demo**:

1. Mutation `seedDemoPlaythrough` sets January-complete ledger with interesting audit risk and jumps to April.  
2. Or client sequence: auto-pick two scripted choices then skip.  

Prefer **one seeded mutation** — reliable on stage Wi-Fi.

Talking points (don’t need to show Convex UI): “Every choice persists in Convex; refresh-safe; filing computed on the server.”

---

## 13. Deployment

| Service | What |
|---------|------|
| **Convex Cloud** | `npx convex dev` locally; deploy Convex for the Render build env |
| **Render** | Web service or static site for Next.js; env `NEXT_PUBLIC_CONVEX_URL` |

Build checklist:

1. Convex project linked  
2. Render app with production Convex URL  
3. Smoke test: create run → refresh → same cash  

---

## 14. Build order (7-hour critical path)

| Block | Hours | Deliverable |
|-------|-------|-------------|
| 0. Scaffold | 0.5 | Next + Tailwind + Convex schema + empty play page |
| 1. Persistence | 0.5 | create/get + localStorage resume |
| 2. Map shell | 1.0 | town.png + hotspots + HUD wired to query |
| 3. Walk + modal | 1.0 | sprite animation + chooseOption |
| 4. Content | 1.0 | 8–10 scenarios + season unlocks |
| 5. Tax + wizard | 1.5 | taxFederal + sidebar filing + audit + results |
| 6. Polish + deploy | 1.0 | demo seed, disclaimer, Render, stamp motion |
| Buffer | 0.5 | copy edits, hotspot calibration |

Cut order if behind: fewer scenarios → simpler walk (teleport fade) → no roulette (instant audit) → skip auth forever.

---

## 15. Testing (minimal)

- Manual: refresh resume, season lock on Tax Office, filing math with a fixture ledger, Play Again clears to new id.  
- Optional: unit test `taxFederal` and `applyEffect` with Vitest if scaffold is free.

---

## 16. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Sprite isn’t true 8-dir | Flip + single walk cycle |
| Hotspots misaligned | Debug overlay; tune % boxes |
| Tax bike-shedding | One constants file; “illustrative federal” disclaimer |
| Demo Wi-Fi | Seeded playthrough; avoid long generation |
| Huge SVG | Use PNG in UI |

---

## 17. Post-MVP hooks (not today)

- Clerk/Convex Auth + `userId` on playthrough  
- BC provincial layer  
- True 12-month calendar  
- Gig café landmark if art added  
- Leaderboard / classroom cohorts  
