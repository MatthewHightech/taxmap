/**
 * Simplified Canadian charitable donation tax credits (educational).
 * Federal: first $200 @ lowest federal rate, remainder @ 29%.
 * Provincial: Ontario-style first $200 @ 5.05%, remainder @ 11.16%.
 * Not tax advice — rates are illustrative.
 */

import {
  federalDonationCredit as federalDonationCreditFromTax,
  federalTuitionCredit,
  LOWEST_FEDERAL_RATE,
} from "./taxFederal";

export const DONATION_FIRST_BRACKET = 200;
export const FEDERAL_LOW_RATE = LOWEST_FEDERAL_RATE;
export const FEDERAL_HIGH_RATE = 0.29;
/** Simplified Ontario charitable donation credit rates. */
export const PROVINCIAL_LOW_RATE = 0.0505;
export const PROVINCIAL_HIGH_RATE = 0.1116;

export type DonationCreditBreakdown = {
  donations: number;
  federal: number;
  provincial: number;
  total: number;
};

function tieredCredit(
  donations: number,
  lowRate: number,
  highRate: number,
): number {
  const amount = Math.max(0, donations);
  const first = Math.min(amount, DONATION_FIRST_BRACKET);
  const rest = Math.max(0, amount - DONATION_FIRST_BRACKET);
  return Math.round(first * lowRate + rest * highRate);
}

export function federalDonationCredit(donations: number): number {
  return federalDonationCreditFromTax(donations);
}

export function provincialDonationCredit(donations: number): number {
  return tieredCredit(donations, PROVINCIAL_LOW_RATE, PROVINCIAL_HIGH_RATE);
}

export function donationCreditBreakdown(
  donations: number,
): DonationCreditBreakdown {
  const federal = federalDonationCredit(donations);
  const provincial = provincialDonationCredit(donations);
  return {
    donations: Math.max(0, donations),
    federal,
    provincial,
    total: federal + provincial,
  };
}

export function totalDonationTaxCredit(donations: number): number {
  return donationCreditBreakdown(donations).total;
}

/**
 * HUD estimate of federal non-refundable credits from tuition
 * (eligible fees × lowest rate) + federal donation credit.
 * Does not include the automatic basic personal amount.
 */
export function effectiveTaxCredits(
  tuitionAmount: number,
  charitableDonations: number,
): number {
  return (
    federalTuitionCredit(tuitionAmount) +
    federalDonationCredit(charitableDonations)
  );
}

export function applyDonation(
  state: { cash: number; charitableDonations?: number },
  amount: number,
): { cash: number; charitableDonations: number; creditAdded: number } {
  const gift = Math.floor(amount);
  if (!Number.isFinite(gift) || gift <= 0) {
    throw new Error("Donation must be a positive amount");
  }
  if (gift > state.cash) {
    throw new Error("Not enough cash for that donation");
  }

  const before = state.charitableDonations ?? 0;
  const after = before + gift;
  const creditBefore = totalDonationTaxCredit(before);
  const creditAfter = totalDonationTaxCredit(after);

  return {
    cash: state.cash - gift,
    charitableDonations: after,
    creditAdded: creditAfter - creditBefore,
  };
}
