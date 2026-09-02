import { v } from "convex/values";
import { getScenario } from "./content/scenarios";
import { mutation, query, internalMutation } from "./_generated/server";
import { rollAudit } from "./lib/audit";
import {
  applyBankLoan,
  applyBankTransfers,
  growSeasonSavings,
} from "./lib/bank";
import {
  applyDonation,
  effectiveTaxCredits,
} from "./lib/donations";
import {
  applyEffect,
  initialStudentLedger,
  netWorth,
  type LedgerFields,
} from "./lib/ledger";
import { computeScore, filingAccuracyScore } from "./lib/scoring";
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
  hisaBalance: v.optional(v.number()),
  tfsaBalance: v.optional(v.number()),
  rrspBalance: v.optional(v.number()),
  fhsaBalance: v.optional(v.number()),
  employmentIncome: v.number(),
  reportedSideIncome: v.number(),
  unreportedSideIncome: v.number(),
  investmentIncome: v.number(),
  withholdings: v.number(),
  deductions: v.number(),
  credits: v.number(),
  charitableDonations: v.optional(v.number()),
  auditRisk: v.number(),
  flags: v.array(v.string()),
  filingSnapshot: v.optional(filingSnapshotValidator),
  auditResult: v.optional(auditResultValidator),
  score: v.optional(v.number()),
  userId: v.optional(v.string()),
  netWorth: v.number(),
});

const bankAccountIdValidator = v.union(
  v.literal("hisa"),
  v.literal("tfsa"),
  v.literal("rrsp"),
  v.literal("fhsa"),
);

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
      hisaBalance: 0,
      tfsaBalance: 0,
      rrspBalance: 0,
      fhsaBalance: 0,
      charitableDonations: 0,
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

    const nextLedger: LedgerFields = applyEffect(doc, option.effects);
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
    const grown = growSeasonSavings(paid);

    await ctx.db.patch("playthroughs", args.playthroughId, {
      ...paid,
      ...grown,
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

export const bankTransfer = mutation({
  args: {
    playthroughId: v.id("playthroughs"),
    deposits: v.array(
      v.object({
        accountId: bankAccountIdValidator,
        amount: v.number(),
      }),
    ),
    withdrawals: v.array(
      v.object({
        accountId: bankAccountIdValidator,
        amount: v.number(),
      }),
    ),
  },
  returns: playthroughPublicValidator,
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("playthroughs", args.playthroughId);
    if (!doc) {
      throw new Error("Playthrough not found");
    }
    if (doc.status !== "playing") {
      throw new Error("Bank is closed for this run");
    }

    const deposits = { hisa: 0, tfsa: 0, rrsp: 0, fhsa: 0 };
    const withdrawals = { hisa: 0, tfsa: 0, rrsp: 0, fhsa: 0 };
    for (const row of args.deposits) {
      deposits[row.accountId] += Math.max(0, Math.floor(row.amount));
    }
    for (const row of args.withdrawals) {
      withdrawals[row.accountId] += Math.max(0, Math.floor(row.amount));
    }

    const next = applyBankTransfers(doc, deposits, withdrawals);

    await ctx.db.patch("playthroughs", args.playthroughId, {
      cash: next.cash,
      investments: next.investments,
      debt: next.debt,
      hisaBalance: next.hisaBalance,
      tfsaBalance: next.tfsaBalance,
      rrspBalance: next.rrspBalance,
      fhsaBalance: next.fhsaBalance,
      employmentIncome: next.employmentIncome,
      reportedSideIncome: next.reportedSideIncome,
      unreportedSideIncome: next.unreportedSideIncome,
      investmentIncome: next.investmentIncome,
      withholdings: next.withholdings,
      deductions: next.deductions,
      credits: next.credits,
      auditRisk: next.auditRisk,
      flags: next.flags,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get("playthroughs", args.playthroughId);
    if (!updated) {
      throw new Error("Playthrough missing after transfer");
    }
    return { ...updated, netWorth: netWorth(updated) };
  },
});

export const bankLoan = mutation({
  args: {
    playthroughId: v.id("playthroughs"),
    amount: v.number(),
  },
  returns: playthroughPublicValidator,
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("playthroughs", args.playthroughId);
    if (!doc) {
      throw new Error("Playthrough not found");
    }
    if (doc.status !== "playing") {
      throw new Error("Bank is closed for this run");
    }

    const next = applyBankLoan(doc, args.amount);

    await ctx.db.patch("playthroughs", args.playthroughId, {
      cash: next.cash,
      debt: next.debt,
      flags: next.flags,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get("playthroughs", args.playthroughId);
    if (!updated) {
      throw new Error("Playthrough missing after loan");
    }
    return { ...updated, netWorth: netWorth(updated) };
  },
});

export const foodBankDonate = mutation({
  args: {
    playthroughId: v.id("playthroughs"),
    amount: v.number(),
  },
  returns: playthroughPublicValidator,
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("playthroughs", args.playthroughId);
    if (!doc) {
      throw new Error("Playthrough not found");
    }
    if (doc.status !== "playing") {
      throw new Error("Food Bank is closed for this run");
    }

    const next = applyDonation(doc, args.amount);
    const flags = new Set(doc.flags);
    flags.add("donated_food_bank");

    await ctx.db.patch("playthroughs", args.playthroughId, {
      cash: next.cash,
      charitableDonations: next.charitableDonations,
      flags: [...flags],
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get("playthroughs", args.playthroughId);
    if (!updated) {
      throw new Error("Playthrough missing after donation");
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

export const cancelFiling = mutation({
  args: {
    playthroughId: v.id("playthroughs"),
  },
  returns: playthroughPublicValidator,
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("playthroughs", args.playthroughId);
    if (!doc) {
      throw new Error("Playthrough not found");
    }
    if (doc.status !== "filing") {
      throw new Error("Not currently filing");
    }

    await ctx.db.patch("playthroughs", args.playthroughId, {
      status: "playing",
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
    employmentIncome: v.number(),
    reportedSideIncome: v.number(),
    investmentIncome: v.number(),
    deductions: v.number(),
    credits: v.number(),
    charitableDonations: v.number(),
    withholdings: v.number(),
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
    if (doc.status !== "filing" && doc.status !== "playing") {
      throw new Error("Return already filed");
    }

    const filed = {
      employmentIncome: Math.max(0, Math.floor(args.employmentIncome)),
      reportedSideIncome: Math.max(0, Math.floor(args.reportedSideIncome)),
      investmentIncome: Math.max(0, Math.floor(args.investmentIncome)),
      deductions: Math.max(0, Math.floor(args.deductions)),
      credits: Math.max(0, Math.floor(args.credits)),
      charitableDonations: Math.max(0, Math.floor(args.charitableDonations)),
      withholdings: Math.max(0, Math.floor(args.withholdings)),
    };

    for (const [key, value] of Object.entries(filed)) {
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${key}`);
      }
    }

    // Cap withholdings at the true payroll amount so players cannot mint cash
    // by typing a fake "tax already withheld" figure.
    const settlementWithholdings = Math.min(
      filed.withholdings,
      Math.max(0, doc.withholdings),
    );

    const tax = computeFederalReturn({
      employmentIncome: filed.employmentIncome,
      reportedSideIncome: filed.reportedSideIncome,
      investmentIncome: filed.investmentIncome,
      deductions: filed.deductions,
      tuitionAmount: filed.credits,
      charitableDonations: filed.charitableDonations,
      withholdings: settlementWithholdings,
    });
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

    const accuracy = filingAccuracyScore({
      filed,
      truth: {
        employmentIncome: doc.employmentIncome,
        reportedSideIncome: doc.reportedSideIncome,
        investmentIncome: doc.investmentIncome,
        deductions: doc.deductions,
        credits: doc.credits,
        charitableDonations: doc.charitableDonations ?? 0,
        withholdings: doc.withholdings,
      },
    });

    const ledgerForScore = {
      cash,
      investments: doc.investments,
      debt: doc.debt,
      employmentIncome: filed.employmentIncome,
      reportedSideIncome: filed.reportedSideIncome,
      unreportedSideIncome: doc.unreportedSideIncome,
      investmentIncome: filed.investmentIncome,
      withholdings: filed.withholdings,
      deductions: filed.deductions,
      credits: effectiveTaxCredits(
        filed.credits,
        filed.charitableDonations,
      ),
      auditRisk: doc.auditRisk,
      flags: doc.flags,
    };

    const score = computeScore({
      ledger: ledgerForScore,
      tax: filingSnapshot,
      auditResult,
      filingAccuracy: accuracy,
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

/** Judge-demo seed: Spring with a messy student ledger. Backend-only. */
export const seedDemo = internalMutation({
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
        "sept-uni-courses",
        "jan-side-gig",
      ],
      unlockedLocationIds: [...SEASON_LOCATIONS.april],
      persona: "student",
      playerName: "Demo Student",
      cash: 2100,
      investments: 1400,
      debt: 2400,
      hisaBalance: 200,
      tfsaBalance: 200,
      rrspBalance: 1000,
      fhsaBalance: 0,
      employmentIncome: 24000,
      reportedSideIncome: 350,
      unreportedSideIncome: 250,
      investmentIncome: 45,
      withholdings: 3600,
      deductions: 500,
      credits: 360,
      charitableDonations: 200,
      auditRisk: 40,
      flags: [
        "salary_24k",
        "has_rrsp",
        "funded_rrsp",
        "paid_tuition",
        "courses_4",
        "hid_tips",
      ],
    });
  },
});
