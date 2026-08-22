import type { Effect } from "../lib/ledger";
import type { Season } from "../lib/seasons";

export type LocationId =
  | "foodBank"
  | "bank"
  | "university"
  | "taxOffice"
  | "home";

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
export const MIN_COURSES = 3;
export const MAX_COURSES = 6;

export function tuitionOption(
  courses: number,
  payWith: "cash" | "loan",
): ScenarioOption {
  const tuition = courses * TUITION_PER_COURSE;
  if (payWith === "cash") {
    return {
      id: `courses_${courses}_cash`,
      label: `Pay cash ($${tuition.toLocaleString()})`,
      description: `Tuition due now. $${tuition.toLocaleString()} tuition tax credit at filing.`,
      effects: {
        cash: -tuition,
        credits: tuition,
        addFlags: [`courses_${courses}`, "paid_tuition", "tuition_cash"],
      },
    };
  }
  return {
    id: `courses_${courses}_loan`,
    label: `Student loan ($${tuition.toLocaleString()})`,
    description: `Debt covers tuition. $${tuition.toLocaleString()} credit at filing.`,
    effects: {
      debt: tuition,
      credits: tuition,
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
 * Summer: home · Fall: uni · Winter: side gig
 * Bank and Food Bank are persistent locations (not one-shot scenarios).
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

  // ——— Fall ———
  {
    id: "sept-uni-courses",
    season: "september",
    locationId: "university",
    title: "Register for Fall courses",
    body: "Tuition is $600 per course. Choose how many classes to take (3–6), then pay with cash or a student loan. More courses mean a bigger bill — and a bigger tuition tax credit in Spring.",
    options: allTuitionOptions(),
  },
  // ——— Winter ———
  {
    id: "jan-side-gig",
    season: "january",
    locationId: "university",
    title: "Holiday campus side gig",
    body: "You earned $600 in wages and tips working a campus holiday shift. How much hits the tax return?",
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
];

export function scenariosForSeason(season: Season): Scenario[] {
  return SCENARIOS.filter((scenario) => scenario.season === season);
}

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}
