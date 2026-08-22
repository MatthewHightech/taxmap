/**
 * Simplified Canadian federal tax estimate for educational play.
 * Brackets are illustrative (approx. 2025 federal rates) — not tax advice.
 */

const BASIC_PERSONAL_AMOUNT = 16129;

const BRACKETS: Array<{ upTo: number; rate: number }> = [
  { upTo: 57375, rate: 0.15 },
  { upTo: 114750, rate: 0.205 },
  { upTo: 177882, rate: 0.26 },
  { upTo: 253414, rate: 0.29 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.33 },
];

export type TaxInput = {
  employmentIncome: number;
  reportedSideIncome: number;
  investmentIncome: number;
  deductions: number;
  credits: number;
  withholdings: number;
};

export type TaxResult = {
  grossIncome: number;
  taxableIncome: number;
  federalTax: number;
  netTax: number;
  withholdings: number;
  credits: number;
  balance: number;
  refund: boolean;
};

export function computeFederalReturn(input: TaxInput): TaxResult {
  const grossIncome =
    input.employmentIncome + input.reportedSideIncome + input.investmentIncome;
  const taxableIncome = Math.max(0, grossIncome - input.deductions);
  const federalTax = federalTaxOn(taxableIncome);
  const netTax = Math.max(0, federalTax - input.credits);
  const balance = netTax - input.withholdings;

  return {
    grossIncome,
    taxableIncome,
    federalTax,
    netTax,
    withholdings: input.withholdings,
    credits: input.credits,
    balance,
    refund: balance < 0,
  };
}

function federalTaxOn(taxableIncome: number): number {
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

  // Rough BPA as non-refundable credit at lowest rate
  const bpaCredit = Math.min(taxableIncome, BASIC_PERSONAL_AMOUNT) * 0.15;
  return Math.max(0, tax - bpaCredit);
}
