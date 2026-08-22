import type { AuditOutcome } from "./audit";
import { netWorth, type LedgerFields } from "./ledger";
import type { TaxResult } from "./taxFederal";

export function computeScore(args: {
  ledger: LedgerFields;
  tax: TaxResult;
  auditResult: AuditOutcome;
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

  return clamp(score, 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
