import {
  QUARTERLY_GROSS_PAY,
  QUARTERLY_NET_PAY,
  QUARTERLY_WITHHOLDING,
} from "./seasons";

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

  const cashDelta = effect.cash ?? 0;
  const nextCash = ledger.cash + cashDelta;
  if (cashDelta < 0 && nextCash < 0) {
    throw new Error(
      `Not enough cash (need $${Math.abs(cashDelta).toLocaleString()}, have $${ledger.cash.toLocaleString()})`,
    );
  }

  return {
    cash: nextCash,
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

/** True when this choice would leave cash below zero. */
export function effectAffordable(
  cash: number,
  effect: Pick<Effect, "cash">,
): boolean {
  const delta = effect.cash ?? 0;
  return delta >= 0 || cash + delta >= 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Student start: $24k/yr job with Summer quarter already paid into cash.
 * Gross YTD one quarter with simplified withholdings.
 */
export function initialStudentLedger(): LedgerFields {
  return {
    cash: 2200 + QUARTERLY_NET_PAY,
    investments: 0,
    debt: 0,
    employmentIncome: QUARTERLY_GROSS_PAY,
    reportedSideIncome: 0,
    unreportedSideIncome: 0,
    investmentIncome: 0,
    withholdings: QUARTERLY_WITHHOLDING,
    deductions: 0,
    credits: 0,
    auditRisk: 0,
    flags: ["salary_24k", "has_hisa", "has_tfsa", "has_rrsp", "has_fhsa"],
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
  money("investments", "Savings");
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
