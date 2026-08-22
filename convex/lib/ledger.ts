export type Effect = {
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
  auditRisk?: number;
  addFlags?: string[];
  removeFlags?: string[];
};

export type LedgerFields = {
  cash: number;
  investments: number;
  debt: number;
  employmentIncome: number;
  reportedSideIncome: number;
  unreportedSideIncome: number;
  investmentIncome: number;
  withholdings: number;
  deductions: number;
  credits: number;
  auditRisk: number;
  flags: string[];
};

export function netWorth(
  ledger: Pick<LedgerFields, "cash" | "investments" | "debt">,
): number {
  return ledger.cash + ledger.investments - ledger.debt;
}

export function applyEffect(ledger: LedgerFields, effect: Effect): LedgerFields {
  const flags = new Set(ledger.flags);
  for (const flag of effect.addFlags ?? []) {
    flags.add(flag);
  }
  for (const flag of effect.removeFlags ?? []) {
    flags.delete(flag);
  }

  return {
    cash: ledger.cash + (effect.cash ?? 0),
    investments: ledger.investments + (effect.investments ?? 0),
    debt: Math.max(0, ledger.debt + (effect.debt ?? 0)),
    employmentIncome: ledger.employmentIncome + (effect.employmentIncome ?? 0),
    reportedSideIncome: ledger.reportedSideIncome + (effect.reportedSideIncome ?? 0),
    unreportedSideIncome:
      ledger.unreportedSideIncome + (effect.unreportedSideIncome ?? 0),
    investmentIncome: ledger.investmentIncome + (effect.investmentIncome ?? 0),
    withholdings: ledger.withholdings + (effect.withholdings ?? 0),
    deductions: ledger.deductions + (effect.deductions ?? 0),
    credits: ledger.credits + (effect.credits ?? 0),
    auditRisk: clamp(ledger.auditRisk + (effect.auditRisk ?? 0), 0, 100),
    flags: [...flags],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Student start: $12k/yr job with Summer quarter already paid into cash.
 * Gross YTD $3,000 with simplified withholdings.
 */
export function initialStudentLedger(): LedgerFields {
  return {
    cash: 2200 + 2550,
    investments: 0,
    debt: 0,
    employmentIncome: 3000,
    reportedSideIncome: 0,
    unreportedSideIncome: 0,
    investmentIncome: 0,
    withholdings: 450,
    deductions: 0,
    credits: 0,
    auditRisk: 0,
    flags: ["salary_12k"],
  };
}

export function formatEffectChips(effect: Effect): string[] {
  const chips: string[] = [];
  const money = (
    key: keyof Effect,
    label: string,
  ) => {
    const value = effect[key];
    if (typeof value === "number" && value !== 0) {
      const sign = value > 0 ? "+" : "";
      chips.push(`${label} ${sign}$${Math.abs(value).toLocaleString()}`);
    }
  };
  money("cash", "Cash");
  money("debt", "Debt");
  money("employmentIncome", "Employment income");
  money("reportedSideIncome", "Reported gig");
  money("unreportedSideIncome", "Unreported");
  money("withholdings", "Withheld");
  money("deductions", "Deductions");
  money("credits", "Credits");
  if (effect.auditRisk) {
    const sign = effect.auditRisk > 0 ? "+" : "";
    chips.push(`Audit ${sign}${effect.auditRisk}%`);
  }
  return chips;
}
