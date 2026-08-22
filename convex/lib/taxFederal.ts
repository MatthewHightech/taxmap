/**
 * Canadian federal income tax estimate (educational simulation).
 * Mirrors the high-level CRA federal process for a simple T1:
 *   income → deductions → taxable income → gross federal tax
 *   → non-refundable credits → tax payable → compare to withholdings.
 *
 * Uses 2025 federal brackets / BPA / lowest credit rate.
 * Not tax advice — omits provincial tax, CPP/EI, transfers, carry-forwards, etc.
 */

/** 2025 maximum basic personal amount (line 30000) for net income ≤ $177,882. */
export const BASIC_PERSONAL_AMOUNT = 16129;

/**
 * 2025 lowest federal rate (blended after mid-year cut).
 * Used for most non-refundable credits (BPA, tuition).
 */
export const LOWEST_FEDERAL_RATE = 0.145;

/** 2025 federal tax brackets (taxable income ceilings). */
const BRACKETS: Array<{ upTo: number; rate: number }> = [
  { upTo: 57375, rate: 0.145 },
  { upTo: 114750, rate: 0.205 },
  { upTo: 177882, rate: 0.26 },
  { upTo: 253414, rate: 0.29 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.33 },
];

export type TaxInput = {
  employmentIncome: number;
  reportedSideIncome: number;
  investmentIncome: number;
  /** RRSP / FHSA contributions and similar deductions from total income. */
  deductions: number;
  /**
   * Eligible tuition fees (line 32300 amount), NOT the credit dollars.
   * Federal credit = amount × lowest rate.
   */
  tuitionAmount: number;
  /** Cash charitable gifts in the year (before credit rates). */
  charitableDonations: number;
  withholdings: number;
};

export type TaxResult = {
  grossIncome: number;
  taxableIncome: number;
  /** Tax on taxable income before non-refundable credits. */
  federalTax: number;
  /** BPA + tuition + federal donation credits actually applied. */
  credits: number;
  /** Federal tax after non-refundable credits (cannot go below $0). */
  netTax: number;
  withholdings: number;
  /** netTax − withholdings; negative ⇒ refund. */
  balance: number;
  refund: boolean;
};

export function federalTuitionCredit(tuitionAmount: number): number {
  return Math.round(Math.max(0, tuitionAmount) * LOWEST_FEDERAL_RATE);
}

export function basicPersonalAmountCredit(netIncome: number): number {
  // Full BPA for student-scale incomes (phase-out starts at $177,882).
  if (netIncome > 253414) {
    return Math.round(14538 * LOWEST_FEDERAL_RATE);
  }
  if (netIncome > 177882) {
    const max = BASIC_PERSONAL_AMOUNT;
    const min = 14538;
    const span = 253414 - 177882;
    const amount = max - ((netIncome - 177882) / span) * (max - min);
    return Math.round(amount * LOWEST_FEDERAL_RATE);
  }
  return Math.round(BASIC_PERSONAL_AMOUNT * LOWEST_FEDERAL_RATE);
}

/** Federal charitable donation credit (first $200 @ lowest rate, rest @ 29%). */
export function federalDonationCredit(donations: number): number {
  const amount = Math.max(0, donations);
  const first = Math.min(amount, 200);
  const rest = Math.max(0, amount - 200);
  return Math.round(first * LOWEST_FEDERAL_RATE + rest * 0.29);
}

export function computeFederalReturn(input: TaxInput): TaxResult {
  const grossIncome = Math.max(
    0,
    input.employmentIncome +
      input.reportedSideIncome +
      input.investmentIncome,
  );
  const taxableIncome = Math.max(0, grossIncome - Math.max(0, input.deductions));

  const federalTax = Math.round(grossFederalTaxOn(taxableIncome));

  const bpaCredit = basicPersonalAmountCredit(grossIncome);
  const tuitionCredit = federalTuitionCredit(input.tuitionAmount);
  const donationCredit = federalDonationCredit(input.charitableDonations);

  // Non-refundable: can wipe out tax but cannot create a refund by themselves.
  const creditsClaimed = bpaCredit + tuitionCredit + donationCredit;
  const creditsApplied = Math.min(federalTax, creditsClaimed);
  const netTax = Math.max(0, federalTax - creditsApplied);
  const balance = netTax - input.withholdings;

  return {
    grossIncome,
    taxableIncome,
    federalTax,
    credits: creditsApplied,
    netTax,
    withholdings: input.withholdings,
    balance,
    refund: balance < 0,
  };
}

function grossFederalTaxOn(taxableIncome: number): number {
  let remaining = taxableIncome;
  let previousCap = 0;
  let tax = 0;

  for (const bracket of BRACKETS) {
    const slice = Math.min(remaining, bracket.upTo - previousCap);
    if (slice <= 0) break;
    tax += slice * bracket.rate;
    remaining -= slice;
    previousCap = bracket.upTo;
  }

  return tax;
}
