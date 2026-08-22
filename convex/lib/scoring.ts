import type { AuditOutcome } from "./audit";
import { netWorth, type LedgerFields } from "./ledger";
import type { TaxResult } from "./taxFederal";

export function computeScore(args: {
  ledger: LedgerFields;
  tax: TaxResult;
  auditResult: AuditOutcome;
  /** 0–1 how closely filed amounts matched the true year ledger. */
  filingAccuracy?: number;
}): number {
  let score = 50;

  const worth = netWorth(args.ledger);
  score += Math.max(-20, Math.min(25, Math.round(worth / 800)));

  if (args.ledger.flags.includes("reported_tips")) score += 10;
  if (args.ledger.flags.includes("claimed_fake_deduction")) score -= 15;
  if (args.ledger.unreportedSideIncome > 0) score -= 10;
  if (args.ledger.credits > 0) score += 8;
  if (args.ledger.auditRisk === 0) score += 10;

  if (args.auditResult === "passed") score += 5;
  if (args.auditResult === "failed") score -= 20;
  if (args.auditResult === "none" && args.ledger.auditRisk === 0) score += 8;

  // Filing on time always helps a bit
  score += 5;

  if (args.filingAccuracy !== undefined) {
    score += Math.round(args.filingAccuracy * 20) - 5;
  }

  return clamp(score, 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Compare filed return fields to the true ledger (exact dollar match). */
export function filingAccuracyScore(args: {
  filed: {
    employmentIncome: number;
    reportedSideIncome: number;
    investmentIncome: number;
    deductions: number;
    credits: number;
    charitableDonations: number;
    withholdings: number;
  };
  truth: {
    employmentIncome: number;
    reportedSideIncome: number;
    investmentIncome: number;
    deductions: number;
    credits: number;
    charitableDonations: number;
    withholdings: number;
  };
}): number {
  const keys = [
    "employmentIncome",
    "reportedSideIncome",
    "investmentIncome",
    "deductions",
    "credits",
    "charitableDonations",
    "withholdings",
  ] as const;
  let hits = 0;
  for (const key of keys) {
    if (Math.round(args.filed[key]) === Math.round(args.truth[key])) {
      hits += 1;
    }
  }
  return hits / keys.length;
}
