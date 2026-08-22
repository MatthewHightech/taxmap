import type { Effect } from "../lib/ledger";
import type { Season } from "../lib/seasons";

export type LocationId =
  | "grocery"
  | "bank"
  | "university"
  | "taxOffice"
  | "home"
  | "car";

export type ScenarioOption = {
  id: string;
  label: string;
  description: string;
  effects: Effect;
};

export type Scenario = {
  id: string;
  season: Season;
  locationId: LocationId;
  title: string;
  body: string;
  options: ScenarioOption[];
};

/**
 * Draft scenario copy — edit freely.
 * Target: 8–12 cards across May / September / January.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "may-grocery-budget",
    season: "may",
    locationId: "grocery",
    title: "Grocery run under pressure",
    body: "Your fridge is empty and a friend invited you out. You have $90 for food this week. How do you play it?",
    options: [
      {
        id: "basics",
        label: "Stick to basics",
        description: "Rice, eggs, veggies. Boring, solvent.",
        effects: { cash: -55, addFlags: ["budget_basics"] },
      },
      {
        id: "splurge",
        label: "Splurge + takeout",
        description: "Treat yourself now, thinner buffer later.",
        effects: { cash: -90, addFlags: ["thin_buffer"] },
      },
      {
        id: "skip",
        label: "Skip groceries, go out",
        description: "Fun tonight. Hangry tomorrow.",
        effects: { cash: -40, auditRisk: 0, addFlags: ["skipped_groceries"] },
      },
    ],
  },
  {
    id: "may-car-insurance",
    season: "may",
    locationId: "car",
    title: "Insurance reminder",
    body: "Your summer job needs reliable transport. Car insurance is due, and the quote stings.",
    options: [
      {
        id: "pay",
        label: "Pay the premium",
        description: "Cash down, risk down.",
        effects: { cash: -180 },
      },
      {
        id: "defer",
        label: "Defer a month",
        description: "Keep cash now; late fee later.",
        effects: { cash: -40, debt: 160, addFlags: ["deferred_insurance"] },
      },
    ],
  },
  {
    id: "may-home-roommate",
    season: "may",
    locationId: "home",
    title: "Roommate utilities",
    body: "Your roommate offers to put the hydro bill in your name for a 'small discount' if you handle cash under the table.",
    options: [
      {
        id: "official",
        label: "Split officially",
        description: "Paper trail. Peace of mind.",
        effects: { cash: -70 },
      },
      {
        id: "under_table",
        label: "Take the cash deal",
        description: "Save a bit. Raise audit vibes.",
        effects: { cash: -40, auditRisk: 8, addFlags: ["shady_utilities"] },
      },
    ],
  },
  {
    id: "sept-uni-tuition",
    season: "september",
    locationId: "university",
    title: "Tuition hits",
    body: "Fall tuition is due. Paying it unlocks education tax credits when you file.",
    options: [
      {
        id: "pay_tuition",
        label: "Pay tuition",
        description: "Big cash hit, future credit.",
        effects: {
          cash: -3200,
          credits: 480,
          addFlags: ["paid_tuition"],
        },
      },
      {
        id: "defer_term",
        label: "Defer a course",
        description: "Lower bill now, slower progress.",
        effects: { cash: -1600, credits: 240, addFlags: ["partial_tuition"] },
      },
    ],
  },
  {
    id: "sept-uni-loan",
    season: "september",
    locationId: "university",
    title: "Student loan top-up",
    body: "OSAP-style funding can cover books — but it's debt with interest later.",
    options: [
      {
        id: "take_loan",
        label: "Take the loan",
        description: "Cash now, debt up.",
        effects: { cash: 2500, debt: 2500, addFlags: ["student_loan"] },
      },
      {
        id: "work_more",
        label: "Work more instead",
        description: "Employment income + withholdings.",
        effects: {
          cash: 900,
          employmentIncome: 1200,
          withholdings: 180,
          addFlags: ["worked_extra"],
        },
      },
    ],
  },
  {
    id: "sept-bank-save",
    season: "september",
    locationId: "bank",
    title: "Open a savings pocket",
    body: "The teller pitches a high-interest savings account for your leftover loan money.",
    options: [
      {
        id: "save",
        label: "Park $800 in savings",
        description: "Less liquid cash, tiny growth stub.",
        effects: {
          cash: -800,
          investments: 800,
          investmentIncome: 12,
          addFlags: ["has_savings"],
        },
      },
      {
        id: "hold_cash",
        label: "Keep it liquid",
        description: "Ready for emergencies.",
        effects: { addFlags: ["kept_liquid"] },
      },
    ],
  },
  {
    id: "jan-side-gig",
    season: "january",
    locationId: "grocery",
    title: "Weekend coffee gig",
    body: "You earned $600 in tips and wages from a cash-heavy side gig. How do you handle it?",
    options: [
      {
        id: "report",
        label: "Report it all",
        description: "Income up, audit risk stays clean.",
        effects: {
          cash: 600,
          reportedSideIncome: 600,
          addFlags: ["reported_tips"],
        },
      },
      {
        id: "partial",
        label: "Report wages only",
        description: "Hide $250 tips under the mattress.",
        effects: {
          cash: 600,
          reportedSideIncome: 350,
          unreportedSideIncome: 250,
          auditRisk: 18,
          addFlags: ["hid_tips"],
        },
      },
      {
        id: "hide",
        label: "Report nothing",
        description: "Maximum cash now. Maximum risk.",
        effects: {
          cash: 600,
          unreportedSideIncome: 600,
          auditRisk: 35,
          addFlags: ["hid_all_gig"],
        },
      },
    ],
  },
  {
    id: "jan-bank-gic",
    season: "january",
    locationId: "bank",
    title: "Locked GIC tease",
    body: "A 1-year GIC pays more than your savings account — but you can't touch it if rent goes sideways.",
    options: [
      {
        id: "lock",
        label: "Lock $500",
        description: "Higher return, lower liquidity.",
        effects: {
          cash: -500,
          investments: 500,
          investmentIncome: 25,
          addFlags: ["locked_gic"],
        },
      },
      {
        id: "skip_gic",
        label: "Stay flexible",
        description: "Keep cash available.",
        effects: { addFlags: ["skipped_gic"] },
      },
    ],
  },
  {
    id: "jan-fake-deduction",
    season: "january",
    locationId: "home",
    title: "A 'clever' deduction tip",
    body: "A classmate swears you can deduct your gaming PC as a 'business expense' even though you only stream for fun.",
    options: [
      {
        id: "claim",
        label: "Claim it anyway",
        description: "Looks like a deduction. Smells like trouble.",
        effects: {
          deductions: 900,
          auditRisk: 22,
          addFlags: ["claimed_fake_deduction"],
        },
      },
      {
        id: "pass",
        label: "Leave it",
        description: "Only claim what you can explain.",
        effects: { addFlags: ["honest_deductions"] },
      },
    ],
  },
  {
    id: "jan-withholding",
    season: "january",
    locationId: "home",
    title: "Winter job pay stub",
    body: "Your campus job paid a holiday bonus. Tax was withheld at source — annoying now, helpful in April.",
    options: [
      {
        id: "accept",
        label: "Take the stub as-is",
        description: "Employment income + withholdings recorded.",
        effects: {
          cash: 1100,
          employmentIncome: 1500,
          withholdings: 280,
          addFlags: ["winter_job"],
        },
      },
      {
        id: "cash_side",
        label: "Ask to be paid cash off-books",
        description: "More take-home. Worse paper trail.",
        effects: {
          cash: 1400,
          unreportedSideIncome: 1400,
          auditRisk: 28,
          addFlags: ["off_books_bonus"],
        },
      },
    ],
  },
];

export function scenariosForSeason(season: Season): Scenario[] {
  return SCENARIOS.filter((scenario) => scenario.season === season);
}

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}
