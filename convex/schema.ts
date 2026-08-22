import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const seasonValidator = v.union(
  v.literal("may"),
  v.literal("september"),
  v.literal("january"),
  v.literal("april"),
);

export const statusValidator = v.union(
  v.literal("playing"),
  v.literal("filing"),
  v.literal("complete"),
);

export const auditResultValidator = v.union(
  v.literal("none"),
  v.literal("passed"),
  v.literal("failed"),
);

export const filingSnapshotValidator = v.object({
  grossIncome: v.number(),
  taxableIncome: v.number(),
  federalTax: v.number(),
  netTax: v.number(),
  withholdings: v.number(),
  credits: v.number(),
  balance: v.number(),
  refund: v.boolean(),
});

export default defineSchema({
  playthroughs: defineTable({
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
  }).index("by_creation", ["createdAt"]),
});
