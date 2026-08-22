export type AuditOutcome = "none" | "passed" | "failed";

export function rollAudit(
  auditRisk: number,
  unreportedSideIncome: number,
  random = Math.random,
): { result: AuditOutcome; penalty: number } {
  if (auditRisk <= 0) {
    return { result: "none", penalty: 0 };
  }

  const failChance = Math.min(0.95, auditRisk / 100);
  const failed = random() < failChance;

  if (!failed) {
    return { result: "passed", penalty: 0 };
  }

  const penalty = Math.round(unreportedSideIncome * 1.25 + 250);
  return { result: "failed", penalty };
}
