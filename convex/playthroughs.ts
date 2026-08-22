import { v } from "convex/values";
import { getScenario } from "./content/scenarios";
import { mutation, query } from "./_generated/server";
import { rollAudit } from "./lib/audit";
import {
  applyEffect,
  initialStudentLedger,
  netWorth,
  type LedgerFields,
} from "./lib/ledger";
import { computeScore } from "./lib/scoring";
import {
  nextSeason,
  QUARTERLY_GROSS_PAY,
  QUARTERLY_NET_PAY,
  QUARTERLY_WITHHOLDING,
  SEASON_LOCATIONS,
  seasonActivitiesComplete,
  type Season,
} from "./lib/seasons";
import { computeFederalReturn } from "./lib/taxFederal";
import {
  auditResultValidator,
  filingSnapshotValidator,
  seasonValidator,
  statusValidator,
} from "./schema";

const playthroughPublicValidator = v.object({
  _id: v.id("playthroughs"),
  _creationTime: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  season: seasonValidator,
  status: statusValidator,
  completedScenarioIds: v.array(v.string()),
  unlockedLocationIds: v.array(v.string()),
  persona: v.literal("student"),
  playerName: v.optional(v.string()),
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
  auditRisk: v.number(),
  flags: v.array(v.string()),
  filingSnapshot: v.optional(filingSnapshotValidator),
  auditResult: v.optional(auditResultValidator),
  score: v.optional(v.number()),
  userId: v.optional(v.string()),
  netWorth: v.number(),
});

function grantQuarterlyPay(ledger: LedgerFields): LedgerFields {
  return {
    ...ledger,
    cash: ledger.cash + QUARTERLY_NET_PAY,
    employmentIncome: ledger.employmentIncome + QUARTERLY_GROSS_PAY,
    withholdings: ledger.withholdings + QUARTERLY_WITHHOLDING,
  };
}

export const create = mutation({
  args: {
    playerName: v.optional(v.string()),
  },
  returns: v.id("playthroughs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const ledger = initialStudentLedger();
    const season: Season = "may";

    return await ctx.db.insert("playthroughs", {
      createdAt: now,
      updatedAt: now,
      season,
      status: "playing",
      completedScenarioIds: [],
      unlockedLocationIds: [...SEASON_LOCATIONS[season]],
      persona: "student",
      playerName: args.playerName,
      ...ledger,
    });
  },
});

export const get = query({
  args: {
    playthroughId: v.id("playthroughs"),
  },
  returns: v.union(playthroughPublicValidator, v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("playthroughs", args.playthroughId);
    if (!doc) {
      return null;
    }
    return { ...doc, netWorth: netWorth(doc) };
  },
});

export const applyChoice = mutation({
  args: {
    playthroughId: v.id("playthroughs"),
    scenarioId: v.string(),
    optionId: v.string(),
  },
  returns: playthroughPublicValidator,
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("playthroughs", args.playthroughId);
    if (!doc) {
      throw new Error("Playthrough not found");
    }
    if (doc.status !== "playing") {
      throw new Error("This run is no longer accepting choices");
    }
    if (doc.completedScenarioIds.includes(args.scenarioId)) {
      throw new Error("Scenario already completed");
    }

    const scenario = getScenario(args.scenarioId);
    if (!scenario) {
      throw new Error("Unknown scenario");
    }
    if (scenario.season !== doc.season) {
      throw new Error("Scenario is not available in this season");
    }
    if (!doc.unlockedLocationIds.includes(scenario.locationId)) {
      throw new Error("Location is locked");
    }

    const option = scenario.options.find((item) => item.id === args.optionId);
    if (!option) {
      throw new Error("Unknown option");
    }

    let nextLedger: LedgerFields = applyEffect(doc, option.effects);
    const completedScenarioIds = [
      ...doc.completedScenarioIds,
      args.scenarioId,
    ];

    await ctx.db.patch("playthroughs", args.playthroughId, {
      ...nextLedger,
      completedScenarioIds,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get("playthroughs", args.playthroughId);
    if (!updated) {
      throw new Error("Playthrough missing after update");
    }
    return { ...updated, netWorth: netWorth(updated) };
  },
});

export const advanceSeason = mutation({
  args: {
    playthroughId: v.id("playthroughs"),
  },
  returns: playthroughPublicValidator,
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("playthroughs", args.playthroughId);
    if (!doc) {
      throw new Error("Playthrough not found");
    }
    if (doc.status !== "playing") {
      throw new Error("Can only advance while playing");
    }

    if (!seasonActivitiesComplete(doc.season, doc.completedScenarioIds)) {
      throw new Error("Finish every activity this season before advancing");
    }

    const upcoming = nextSeason(doc.season);
    if (!upcoming) {
      throw new Error("Already at Tax Day");
    }

    const paid = grantQuarterlyPay(doc);

    await ctx.db.patch("playthroughs", args.playthroughId, {
      ...paid,
      season: upcoming,
      unlockedLocationIds: [...SEASON_LOCATIONS[upcoming]],
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get("playthroughs", args.playthroughId);
    if (!updated) {
      throw new Error("Playthrough missing after update");
    }
    return { ...updated, netWorth: netWorth(updated) };
  },
});

export const startFiling = mutation({
  args: {
    playthroughId: v.id("playthroughs"),
  },
  returns: playthroughPublicValidator,
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("playthroughs", args.playthroughId);
    if (!doc) {
      throw new Error("Playthrough not found");
    }
    if (doc.season !== "april") {
      throw new Error("Tax Office opens in Spring");
    }

    await ctx.db.patch("playthroughs", args.playthroughId, {
      status: "filing",
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get("playthroughs", args.playthroughId);
    if (!updated) {
      throw new Error("Playthrough missing after update");
    }
    return { ...updated, netWorth: netWorth(updated) };
  },
});

export const submitReturn = mutation({
  args: {
    playthroughId: v.id("playthroughs"),
  },
  returns: playthroughPublicValidator,
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("playthroughs", args.playthroughId);
    if (!doc) {
      throw new Error("Playthrough not found");
    }
    if (doc.season !== "april") {
      throw new Error("Can only file in Spring");
    }

    const tax = computeFederalReturn(doc);
    const { result: auditResult, penalty } = rollAudit(
      doc.auditRisk,
      doc.unreportedSideIncome,
    );

    let cash = doc.cash;
    let balance = tax.balance;
    if (auditResult === "failed") {
      cash -= penalty;
      balance += penalty;
    }

    const filingSnapshot = {
      ...tax,
      balance,
      refund: balance < 0,
    };

    if (filingSnapshot.refund) {
      cash += Math.abs(filingSnapshot.balance);
    } else {
      cash -= filingSnapshot.balance;
    }

    const ledgerForScore = {
      cash,
      investments: doc.investments,
      debt: doc.debt,
      employmentIncome: doc.employmentIncome,
      reportedSideIncome: doc.reportedSideIncome,
      unreportedSideIncome: doc.unreportedSideIncome,
      investmentIncome: doc.investmentIncome,
      withholdings: doc.withholdings,
      deductions: doc.deductions,
      credits: doc.credits,
      auditRisk: doc.auditRisk,
      flags: doc.flags,
    };

    const score = computeScore({
      ledger: ledgerForScore,
      tax: filingSnapshot,
      auditResult,
    });

    await ctx.db.patch("playthroughs", args.playthroughId, {
      cash,
      filingSnapshot,
      auditResult,
      score,
      status: "complete",
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get("playthroughs", args.playthroughId);
    if (!updated) {
      throw new Error("Playthrough missing after update");
    }
    return { ...updated, netWorth: netWorth(updated) };
  },
});

/** Judge-demo seed: Spring with a messy student ledger. */
export const seedDemo = mutation({
  args: {},
  returns: v.id("playthroughs"),
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db.insert("playthroughs", {
      createdAt: now,
      updatedAt: now,
      season: "april",
      status: "playing",
      completedScenarioIds: [
        "may-home-rent",
        "may-car-upkeep",
        "may-bank-setup",
        "sept-uni-courses",
        "sept-grocery",
        "sept-bank-fund",
        "jan-car-emergency",
        "jan-side-gig",
        "jan-fake-deduction",
      ],
      unlockedLocationIds: [...SEASON_LOCATIONS.april],
      persona: "student",
      playerName: "Demo Student",
      cash: 2100,
      investments: 1400,
      debt: 2400,
      employmentIncome: 12000,
      reportedSideIncome: 350,
      unreportedSideIncome: 250,
      investmentIncome: 45,
      withholdings: 4500,
      deductions: 500,
      credits: 360,
      auditRisk: 40,
      flags: [
        "salary_12k",
        "has_rrsp",
        "funded_rrsp",
        "paid_tuition",
        "courses_4",
        "hid_tips",
        "claimed_fake_deduction",
      ],
    });
  },
});
