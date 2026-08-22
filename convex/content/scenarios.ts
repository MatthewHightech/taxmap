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

const TUITION_PER_COURSE = 600;
const TUITION_CREDIT_RATE = 0.15;
export const MIN_COURSES = 3;
export const MAX_COURSES = 6;

export function tuitionOption(
  courses: number,
  payWith: "cash" | "loan",
): ScenarioOption {
  const tuition = courses * TUITION_PER_COURSE;
  const credit = Math.round(tuition * TUITION_CREDIT_RATE);
  if (payWith === "cash") {
    return {
      id: `courses_${courses}_cash`,
      label: `Pay cash ($${tuition.toLocaleString()})`,
      description: `Tuition due now. ~$${credit} tuition tax credit at filing.`,
      effects: {
        cash: -tuition,
        credits: credit,
        addFlags: [`courses_${courses}`, "paid_tuition", "tuition_cash"],
      },
    };
  }
  return {
    id: `courses_${courses}_loan`,
    label: `Student loan ($${tuition.toLocaleString()})`,
    description: `Debt covers tuition. ~$${credit} credit at filing.`,
    effects: {
      debt: tuition,
      credits: credit,
      addFlags: [`courses_${courses}`, "paid_tuition", "student_loan"],
    },
  };
}

function allTuitionOptions(): ScenarioOption[] {
  const options: ScenarioOption[] = [];
  for (let courses = MIN_COURSES; courses <= MAX_COURSES; courses += 1) {
    options.push(tuitionOption(courses, "cash"));
    options.push(tuitionOption(courses, "loan"));
  }
  return options;
}

/**
 * Student year scenarios — edit freely.
 * Summer: home, car, bank · Fall: uni, grocery, bank fund · Winter: emergency, gig, trap
 */
export const SCENARIOS: Scenario[] = [
  // ——— Summer ———
  {
    id: "may-home-rent",
    season: "may",
    locationId: "home",
    title: "Summer rent is due",
    body: "Your landlord wants $800 for the month, plus utilities. Your first paycheque from the $12k job is already in your account — how do you cover living costs?",
    options: [
      {
        id: "full",
        label: "Pay rent + utilities ($950)",
        description: "Stay current. Smaller cash buffer.",
        effects: { cash: -950, addFlags: ["rent_current"] },
      },
      {
        id: "rent_only",
        label: "Pay rent only ($800)",
        description: "Utilities slide. Late fee later.",
        effects: {
          cash: -800,
          debt: 180,
          addFlags: ["utilities_deferred"],
        },
      },
      {
        id: "roommate",
        label: "Split with a roommate ($520)",
        description: "Cheaper, less privacy.",
        effects: { cash: -520, addFlags: ["has_roommate"] },
      },
    ],
  },
  {
    id: "may-car-upkeep",
    season: "may",
    locationId: "car",
    title: "Gas & maintenance",
    body: "Summer commuting needs about $300 for gas and basic maintenance. Skipping it might bite you when winter hits.",
    options: [
      {
        id: "pay",
        label: "Pay $300 now",
        description: "Car stays reliable.",
        effects: { cash: -300, addFlags: ["car_maintained"] },
      },
      {
        id: "defer",
        label: "Defer maintenance ($120 gas only)",
        description: "Save cash now. Winter repairs cost more.",
        effects: {
          cash: -120,
          addFlags: ["deferred_car_maintenance"],
        },
      },
      {
        id: "transit",
        label: "Sell the car, use transit",
        description: "Big cash in, no car costs — less flexible.",
        effects: {
          cash: 1800,
          addFlags: ["no_car", "transit_only"],
        },
      },
    ],
  },
  {
    id: "may-bank-setup",
    season: "may",
    locationId: "bank",
    title: "Open your money toolkit",
    body: "The teller walks you through starter products. Pick one move for Summer — you can fund registered accounts later in Fall.",
    options: [
      {
        id: "open_hisa",
        label: "Open a high-interest savings account",
        description: "Liquid emergency cash. Move $400 in.",
        effects: {
          cash: -400,
          investments: 400,
          investmentIncome: 8,
          addFlags: ["has_hisa"],
        },
      },
      {
        id: "open_tfsa",
        label: "Open a TFSA",
        description: "Tax-free growth room. Seed with $400.",
        effects: {
          cash: -400,
          investments: 400,
          addFlags: ["has_tfsa"],
        },
      },
      {
        id: "open_rrsp",
        label: "Open an RRSP",
        description: "Future deduction when you contribute. Seed $400.",
        effects: {
          cash: -400,
          investments: 400,
          addFlags: ["has_rrsp"],
        },
      },
      {
        id: "open_fhsa",
        label: "Open an FHSA",
        description: "First-home savings — deductible contributions. Seed $400.",
        effects: {
          cash: -400,
          investments: 400,
          addFlags: ["has_fhsa"],
        },
      },
      {
        id: "personal_loan",
        label: "Take a $1,500 personal loan",
        description: "Cash now, debt + interest later.",
        effects: {
          cash: 1500,
          debt: 1650,
          addFlags: ["personal_loan"],
        },
      },
      {
        id: "gic",
        label: "Lock $800 in a 1-year GIC",
        description: "Higher return stub, but cash is stuck until Winter.",
        effects: {
          cash: -800,
          investments: 800,
          investmentIncome: 35,
          addFlags: ["locked_gic"],
        },
      },
    ],
  },

  // ——— Fall ———
  {
    id: "sept-uni-courses",
    season: "september",
    locationId: "university",
    title: "Register for Fall courses",
    body: "Tuition is $600 per course. Choose how many classes to take (3–6), then pay with cash or a student loan. More courses mean a bigger bill — and a bigger tuition tax credit in Spring.",
    options: allTuitionOptions(),
  },
  {
    id: "sept-grocery",
    season: "september",
    locationId: "grocery",
    title: "Grocery run after tuition",
    body: "Your fridge is empty and meal plan FOMO is real. Stretch the budget after paying school costs.",
    options: [
      {
        id: "basics",
        label: "Basics only ($70)",
        description: "Rice, eggs, veggies. Buffer intact.",
        effects: { cash: -70, addFlags: ["budget_basics"] },
      },
      {
        id: "normal",
        label: "Normal cart ($120)",
        description: "Comfortable week of food.",
        effects: { cash: -120, addFlags: ["grocery_normal"] },
      },
      {
        id: "splurge",
        label: "Splurge + takeout ($190)",
        description: "Tasty now, thinner buffer for Winter.",
        effects: { cash: -190, addFlags: ["thin_buffer"] },
      },
    ],
  },
  {
    id: "sept-bank-fund",
    season: "september",
    locationId: "bank",
    title: "Fund an account",
    body: "Fall is contribution season. Put $500 into a plan — RRSP and FHSA can lower taxable income in Spring. TFSA grows tax-free. HISA stays liquid. Or keep the cash.",
    options: [
      {
        id: "fund_rrsp",
        label: "Contribute $500 to an RRSP",
        description: "Cash goes into RRSP · deduction +$500 at filing.",
        effects: {
          cash: -500,
          investments: 500,
          deductions: 500,
          addFlags: ["has_rrsp", "funded_rrsp"],
        },
      },
      {
        id: "fund_fhsa",
        label: "Contribute $500 to an FHSA",
        description: "First-home room · deduction +$500 at filing.",
        effects: {
          cash: -500,
          investments: 500,
          deductions: 500,
          addFlags: ["has_fhsa", "funded_fhsa"],
        },
      },
      {
        id: "fund_tfsa",
        label: "Contribute $500 to a TFSA",
        description: "Tax-free growth. No immediate deduction.",
        effects: {
          cash: -500,
          investments: 500,
          addFlags: ["has_tfsa", "funded_tfsa"],
        },
      },
      {
        id: "fund_hisa",
        label: "Park $500 in high-interest savings",
        description: "Liquid buffer. Small interest stub.",
        effects: {
          cash: -500,
          investments: 500,
          investmentIncome: 10,
          addFlags: ["has_hisa", "funded_hisa"],
        },
      },
      {
        id: "skip_fund",
        label: "Keep $500 as cash",
        description: "Maximum liquidity for Winter surprises.",
        effects: { addFlags: ["kept_cash_fall"] },
      },
    ],
  },

  // ——— Winter ———
  {
    id: "jan-car-emergency",
    season: "january",
    locationId: "car",
    title: "Winter car trouble",
    body: "A dead battery and winter tires — or a surprise transit pass if you sold the car. Cash-tight players feel this one.",
    options: [
      {
        id: "fix_full",
        label: "Fix it properly ($650)",
        description: "Painful now, reliable through Spring.",
        effects: { cash: -650, addFlags: ["winter_car_fixed"] },
      },
      {
        id: "band_aid",
        label: "Cheap battery only ($280)",
        description: "Gets you to Spring. No tires.",
        effects: { cash: -280, addFlags: ["winter_bandaid"] },
      },
      {
        id: "borrow",
        label: "Put $650 on a credit card",
        description: "Cash safe, debt up.",
        effects: { debt: 650, addFlags: ["winter_card_debt"] },
      },
      {
        id: "transit_pass",
        label: "Skip car — monthly transit ($95)",
        description: "Works if you're already transit-only.",
        effects: { cash: -95, addFlags: ["winter_transit"] },
      },
    ],
  },
  {
    id: "jan-side-gig",
    season: "january",
    locationId: "grocery",
    title: "Holiday side gig",
    body: "You earned $600 in wages and tips over the break. How much hits the tax return?",
    options: [
      {
        id: "report_all",
        label: "Report all $600",
        description: "Clean record. Income counted in Spring.",
        effects: {
          cash: 600,
          reportedSideIncome: 600,
          addFlags: ["reported_tips"],
        },
      },
      {
        id: "hide_tips",
        label: "Report wages only ($350)",
        description: "Hide $250 tips. Audit risk up.",
        effects: {
          cash: 600,
          reportedSideIncome: 350,
          unreportedSideIncome: 250,
          auditRisk: 18,
          addFlags: ["hid_tips"],
        },
      },
      {
        id: "hide_all",
        label: "Report nothing",
        description: "Maximum risk. Mattress cash.",
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
    id: "jan-fake-deduction",
    season: "january",
    locationId: "home",
    title: "A 'clever' deduction tip",
    body: "A classmate swears you can write off a gaming PC as a 'school business expense' even though you only stream for fun.",
    options: [
      {
        id: "claim",
        label: "Claim $900 anyway",
        description: "Looks like a deduction. Smells like an audit.",
        effects: {
          deductions: 900,
          auditRisk: 22,
          addFlags: ["claimed_fake_deduction"],
        },
      },
      {
        id: "pass",
        label: "Only claim what you can explain",
        description: "No fake write-off. Cleaner Spring.",
        effects: { addFlags: ["honest_deductions"] },
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
