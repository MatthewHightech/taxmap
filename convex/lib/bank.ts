import type { LedgerFields } from "./ledger";

export type BankAccountId = "hisa" | "tfsa" | "rrsp" | "fhsa";

export type BankBalances = Record<BankAccountId, number>;

/** Per-season growth. HISA ≈ 4%/year; registered accounts ≈ 8%/year. */
export const SEASON_GROWTH_RATE: Record<BankAccountId, number> = {
  hisa: 0.01, // 4% / year
  tfsa: 0.02, // 8% / year
  rrsp: 0.02,
  fhsa: 0.02,
};

export const BANK_ACCOUNTS: ReadonlyArray<{
  id: BankAccountId;
  label: string;
  shortLabel: string;
  blurb: string;
  deductible: boolean;
  seasonGrowthRate: number;
  annualGrowthLabel: string;
}> = [
  {
    id: "hisa",
    label: "High-Interest Savings (HISA)",
    shortLabel: "HISA",
    blurb:
      "Liquid emergency cash. Grows ~1% each season (4%/year). Interest is taxable. Not deductible.",
    deductible: false,
    seasonGrowthRate: SEASON_GROWTH_RATE.hisa,
    annualGrowthLabel: "4%/year",
  },
  {
    id: "tfsa",
    label: "Tax-Free Savings Account (TFSA)",
    shortLabel: "TFSA",
    blurb:
      "Tax-free growth ~2% each season (8%/year). Contributions are not deductible.",
    deductible: false,
    seasonGrowthRate: SEASON_GROWTH_RATE.tfsa,
    annualGrowthLabel: "8%/year",
  },
  {
    id: "rrsp",
    label: "Registered Retirement Savings Plan (RRSP)",
    shortLabel: "RRSP",
    blurb:
      "Grows ~2% each season (8%/year). Contributions lower taxable income at filing.",
    deductible: true,
    seasonGrowthRate: SEASON_GROWTH_RATE.rrsp,
    annualGrowthLabel: "8%/year",
  },
  {
    id: "fhsa",
    label: "First Home Savings Account (FHSA)",
    shortLabel: "FHSA",
    blurb:
      "First-home savings. Grows ~2% each season (8%/year). Contributions are deductible.",
    deductible: true,
    seasonGrowthRate: SEASON_GROWTH_RATE.fhsa,
    annualGrowthLabel: "8%/year",
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

type BankLedger = LedgerFields & {
  hisaBalance?: number;
  tfsaBalance?: number;
  rrspBalance?: number;
  fhsaBalance?: number;
};

type BankLedgerResult = LedgerFields & {
  hisaBalance: number;
  tfsaBalance: number;
  rrspBalance: number;
  fhsaBalance: number;
};

function withBalances(
  ledger: BankLedger,
  balances: BankBalances,
  extras: Partial<LedgerFields>,
): BankLedgerResult {
  return {
    ...ledger,
    ...extras,
    investments: totalSavings(balances),
    hisaBalance: balances.hisa,
    tfsaBalance: balances.tfsa,
    rrspBalance: balances.rrsp,
    fhsaBalance: balances.fhsa,
  };
}

/** Grow each account by its season rate; sync investments total. */
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
    hisa: Math.round(before.hisa * (1 + SEASON_GROWTH_RATE.hisa)),
    tfsa: Math.round(before.tfsa * (1 + SEASON_GROWTH_RATE.tfsa)),
    rrsp: Math.round(before.rrsp * (1 + SEASON_GROWTH_RATE.rrsp)),
    fhsa: Math.round(before.fhsa * (1 + SEASON_GROWTH_RATE.fhsa)),
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
  ledger: BankLedger,
  deposits: BankBalances,
): BankLedgerResult {
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

  for (const row of amounts) {
    if (row.amount <= 0) continue;
    balances[row.id] += row.amount;
    flags.add(`has_${row.id}`);
    flags.add(`funded_${row.id}`);
    if (row.deductible) {
      deductions += row.amount;
    }
  }

  return withBalances(ledger, balances, {
    cash: ledger.cash - total,
    deductions,
    flags: [...flags],
  });
}

export function applyBankWithdrawals(
  ledger: BankLedger,
  withdrawals: BankBalances,
): BankLedgerResult {
  const amounts = BANK_ACCOUNTS.map((account) => ({
    id: account.id,
    amount: Math.max(0, Math.floor(withdrawals[account.id] || 0)),
  }));

  const total = amounts.reduce((sum, row) => sum + row.amount, 0);
  if (total <= 0) {
    throw new Error("Enter at least one withdrawal");
  }

  const balances = balancesFromDoc(ledger);
  for (const row of amounts) {
    if (row.amount <= 0) continue;
    if (row.amount > balances[row.id]) {
      throw new Error(
        `Not enough in ${row.id.toUpperCase()} to withdraw $${row.amount.toLocaleString()}`,
      );
    }
    balances[row.id] -= row.amount;
  }

  return withBalances(ledger, balances, {
    cash: ledger.cash + total,
  });
}

/** Apply deposits and withdrawals in one step (deposits first, then withdrawals). */
export function applyBankTransfers(
  ledger: BankLedger,
  deposits: BankBalances,
  withdrawals: BankBalances,
): BankLedgerResult {
  const depositTotal = BANK_ACCOUNTS.reduce(
    (sum, account) => sum + Math.max(0, Math.floor(deposits[account.id] || 0)),
    0,
  );
  const withdrawTotal = BANK_ACCOUNTS.reduce(
    (sum, account) =>
      sum + Math.max(0, Math.floor(withdrawals[account.id] || 0)),
    0,
  );

  if (depositTotal <= 0 && withdrawTotal <= 0) {
    throw new Error("Enter a deposit or withdrawal amount");
  }

  let next: BankLedger = ledger;
  if (depositTotal > 0) {
    next = applyBankDeposits(next, deposits);
  }
  if (withdrawTotal > 0) {
    next = applyBankWithdrawals(next, withdrawals);
  }
  return next as BankLedgerResult;
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
