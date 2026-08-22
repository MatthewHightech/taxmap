import type { LedgerFields } from "./ledger";

export type BankAccountId = "hisa" | "tfsa" | "rrsp" | "fhsa";

export type BankBalances = Record<BankAccountId, number>;

export const BANK_ACCOUNTS: ReadonlyArray<{
  id: BankAccountId;
  label: string;
  shortLabel: string;
  blurb: string;
  deductible: boolean;
}> = [
  {
    id: "hisa",
    label: "High-Interest Savings (HISA)",
    shortLabel: "HISA",
    blurb: "Liquid emergency cash. Small interest stub. Not tax-deductible.",
    deductible: false,
  },
  {
    id: "tfsa",
    label: "Tax-Free Savings Account (TFSA)",
    shortLabel: "TFSA",
    blurb: "Growth is tax-free. Contributions are not deductible.",
    deductible: false,
  },
  {
    id: "rrsp",
    label: "Registered Retirement Savings Plan (RRSP)",
    shortLabel: "RRSP",
    blurb: "Contributions lower taxable income at filing.",
    deductible: true,
  },
  {
    id: "fhsa",
    label: "First Home Savings Account (FHSA)",
    shortLabel: "FHSA",
    blurb: "First-home savings. Contributions are deductible.",
    deductible: true,
  },
];

/** Flat fee added to debt when you borrow (educational simplification). */
export const LOAN_INTEREST_RATE = 0.1;
export const LOAN_MIN = 100;
export const LOAN_MAX = 5000;

export const LOAN_TERMS = {
  interestRate: LOAN_INTEREST_RATE,
  minAmount: LOAN_MIN,
  maxAmount: LOAN_MAX,
  title: "Personal loan",
  summary:
    "Borrow cash now. You repay principal plus a 10% flat fee by Tax Day (simplified).",
  bullets: [
    "Cash increases by the amount you borrow",
    "Debt increases by principal + 10% fee",
    "Example: borrow $1,000 → +$1,000 cash, +$1,100 debt",
    "No monthly payments in this sim — it sits on your ledger until Spring",
  ],
} as const;

export function emptyBankBalances(): BankBalances {
  return { hisa: 0, tfsa: 0, rrsp: 0, fhsa: 0 };
}

export function totalSavings(balances: BankBalances): number {
  return balances.hisa + balances.tfsa + balances.rrsp + balances.fhsa;
}

export function balancesFromDoc(doc: {
  hisaBalance?: number;
  tfsaBalance?: number;
  rrspBalance?: number;
  fhsaBalance?: number;
  investments?: number;
}): BankBalances {
  const hasAny =
    doc.hisaBalance !== undefined ||
    doc.tfsaBalance !== undefined ||
    doc.rrspBalance !== undefined ||
    doc.fhsaBalance !== undefined;

  if (!hasAny) {
    // Legacy runs only tracked a lump investments total.
    return {
      hisa: 0,
      tfsa: 0,
      rrsp: doc.investments ?? 0,
      fhsa: 0,
    };
  }

  return {
    hisa: doc.hisaBalance ?? 0,
    tfsa: doc.tfsaBalance ?? 0,
    rrsp: doc.rrspBalance ?? 0,
    fhsa: doc.fhsaBalance ?? 0,
  };
}

export function loanDebtForPrincipal(principal: number): number {
  return Math.round(principal * (1 + LOAN_INTEREST_RATE));
}

/** Quarterly growth applied when advancing seasons. */
export const SEASON_SAVINGS_GROWTH_RATE = 0.05;

/** Grow each registered/savings balance by the season rate; sync investments total. */
export function growSeasonSavings(doc: {
  hisaBalance?: number;
  tfsaBalance?: number;
  rrspBalance?: number;
  fhsaBalance?: number;
  investments?: number;
  investmentIncome: number;
}): {
  hisaBalance: number;
  tfsaBalance: number;
  rrspBalance: number;
  fhsaBalance: number;
  investments: number;
  investmentIncome: number;
} {
  const before = balancesFromDoc(doc);
  const after: BankBalances = {
    hisa: Math.round(before.hisa * (1 + SEASON_SAVINGS_GROWTH_RATE)),
    tfsa: Math.round(before.tfsa * (1 + SEASON_SAVINGS_GROWTH_RATE)),
    rrsp: Math.round(before.rrsp * (1 + SEASON_SAVINGS_GROWTH_RATE)),
    fhsa: Math.round(before.fhsa * (1 + SEASON_SAVINGS_GROWTH_RATE)),
  };

  // HISA growth is taxable interest in this simplified sim.
  const hisaGain = after.hisa - before.hisa;

  return {
    hisaBalance: after.hisa,
    tfsaBalance: after.tfsa,
    rrspBalance: after.rrsp,
    fhsaBalance: after.fhsa,
    investments: totalSavings(after),
    investmentIncome: doc.investmentIncome + Math.max(0, hisaGain),
  };
}

export function applyBankDeposits(
  ledger: LedgerFields & {
    hisaBalance?: number;
    tfsaBalance?: number;
    rrspBalance?: number;
    fhsaBalance?: number;
  },
  deposits: BankBalances,
): LedgerFields & {
  hisaBalance: number;
  tfsaBalance: number;
  rrspBalance: number;
  fhsaBalance: number;
} {
  const amounts = BANK_ACCOUNTS.map((account) => ({
    id: account.id,
    amount: Math.max(0, Math.floor(deposits[account.id] || 0)),
    deductible: account.deductible,
  }));

  const total = amounts.reduce((sum, row) => sum + row.amount, 0);
  if (total <= 0) {
    throw new Error("Enter at least one deposit");
  }
  if (total > ledger.cash) {
    throw new Error("Not enough cash for these deposits");
  }

  const balances = balancesFromDoc(ledger);
  const flags = new Set(ledger.flags);
  let deductions = ledger.deductions;
  let investmentIncome = ledger.investmentIncome;

  for (const row of amounts) {
    if (row.amount <= 0) continue;
    balances[row.id] += row.amount;
    flags.add(`has_${row.id}`);
    flags.add(`funded_${row.id}`);
    if (row.deductible) {
      deductions += row.amount;
    }
    if (row.id === "hisa") {
      investmentIncome += Math.max(1, Math.floor(row.amount * 0.02));
    }
  }

  return {
    ...ledger,
    cash: ledger.cash - total,
    investments: totalSavings(balances),
    deductions,
    investmentIncome,
    flags: [...flags],
    hisaBalance: balances.hisa,
    tfsaBalance: balances.tfsa,
    rrspBalance: balances.rrsp,
    fhsaBalance: balances.fhsa,
  };
}

export function applyBankLoan(
  ledger: LedgerFields,
  principal: number,
): LedgerFields {
  const amount = Math.floor(principal);
  if (amount < LOAN_MIN) {
    throw new Error(`Minimum loan is $${LOAN_MIN}`);
  }
  if (amount > LOAN_MAX) {
    throw new Error(`Maximum loan is $${LOAN_MAX.toLocaleString()}`);
  }

  const flags = new Set(ledger.flags);
  flags.add("personal_loan");

  return {
    ...ledger,
    cash: ledger.cash + amount,
    debt: ledger.debt + loanDebtForPrincipal(amount),
    flags: [...flags],
  };
}
