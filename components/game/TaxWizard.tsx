"use client";

import { useMemo, useState } from "react";
import { donationCreditBreakdown } from "../../convex/lib/donations";
import {
  computeFederalReturn,
  federalTuitionCredit,
  LOWEST_FEDERAL_RATE,
} from "../../convex/lib/taxFederal";

export type YearLedger = {
  employmentIncome: number;
  reportedSideIncome: number;
  unreportedSideIncome: number;
  investmentIncome: number;
  deductions: number;
  credits: number;
  charitableDonations: number;
  withholdings: number;
  auditRisk: number;
};

export type FiledReturn = {
  employmentIncome: number;
  reportedSideIncome: number;
  investmentIncome: number;
  deductions: number;
  credits: number;
  charitableDonations: number;
  withholdings: number;
};

type StepId =
  | "intro"
  | "income"
  | "deductions"
  | "credits"
  | "withholdings"
  | "review";

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: "intro", label: "Start" },
  { id: "income", label: "Income" },
  { id: "deductions", label: "Deductions" },
  { id: "credits", label: "Credits" },
  { id: "withholdings", label: "Withheld" },
  { id: "review", label: "File" },
];

type TaxWizardProps = {
  ledger: YearLedger;
  busy?: boolean;
  onFile: (filed: FiledReturn) => void;
};

function parseDollars(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

function MoneyField({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (raw: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-tm-green-300">
        {label}
      </span>
      {hint ? (
        <span className="mt-0.5 block text-xs text-tm-cream/55">{hint}</span>
      ) : null}
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border-2 border-tm-cream/20 bg-black/45 px-3 py-2 focus-within:border-tm-gold">
        <span className="font-[family-name:var(--font-game)] text-tm-gold">$</span>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          disabled={disabled}
          value={value}
          placeholder="0"
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream outline-none disabled:opacity-60"
        />
      </div>
    </label>
  );
}

function LedgerRow({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/10 py-2 last:border-b-0">
      <span
        className={`text-sm ${warn ? "text-tm-danger" : "text-tm-cream/75"}`}
      >
        {label}
      </span>
      <span
        className={`font-[family-name:var(--font-game)] text-sm font-extrabold ${
          warn ? "text-tm-danger" : "text-tm-gold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function LedgerPanel({ ledger }: { ledger: YearLedger }) {
  const donationPreview = donationCreditBreakdown(ledger.charitableDonations);

  return (
    <>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tm-green-300">
        Year ledger
      </p>
      <h2 className="mt-1 font-[family-name:var(--font-game)] text-xl font-extrabold text-tm-cream">
        Your slips & totals
      </h2>
      <p className="mt-2 text-xs text-tm-cream/60">
        Copy these amounts into the return. Educational sim only — not tax
        advice.
      </p>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-tm-gold">
          Income
        </p>
        <LedgerRow
          label="Employment (T4)"
          value={`$${ledger.employmentIncome.toLocaleString()}`}
        />
        <LedgerRow
          label="Gig / tips reported"
          value={`$${ledger.reportedSideIncome.toLocaleString()}`}
        />
        {ledger.unreportedSideIncome > 0 ? (
          <LedgerRow
            label="Tips kept off books"
            value={`$${ledger.unreportedSideIncome.toLocaleString()}`}
            warn
          />
        ) : null}
        <LedgerRow
          label="Investment income"
          value={`$${ledger.investmentIncome.toLocaleString()}`}
        />
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-tm-gold">
          Deductions & credits
        </p>
        <LedgerRow
          label="RRSP / FHSA deductions"
          value={`$${ledger.deductions.toLocaleString()}`}
        />
        <LedgerRow
          label="Eligible tuition fees"
          value={`$${ledger.credits.toLocaleString()}`}
        />
        <LedgerRow
          label="Tuition credit (fed. est.)"
          value={`$${federalTuitionCredit(ledger.credits).toLocaleString()}`}
        />
        <LedgerRow
          label="Charitable donations"
          value={`$${ledger.charitableDonations.toLocaleString()}`}
        />
        <LedgerRow
          label="Donation credit (fed. + ON est.)"
          value={`$${donationPreview.total.toLocaleString()}`}
        />
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-tm-gold">
          Payroll
        </p>
        <LedgerRow
          label="Tax already withheld"
          value={`$${ledger.withholdings.toLocaleString()}`}
        />
        <LedgerRow label="Audit risk" value={`${ledger.auditRisk}%`} />
      </div>
    </>
  );
}

export function TaxWizard({ ledger, busy, onFile }: TaxWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const step = STEPS[stepIndex]!.id;

  const [employment, setEmployment] = useState(
    String(ledger.employmentIncome),
  );
  const [sideIncome, setSideIncome] = useState(
    String(ledger.reportedSideIncome),
  );
  const [investment, setInvestment] = useState(
    String(ledger.investmentIncome),
  );
  const [deductions, setDeductions] = useState(String(ledger.deductions));
  const [credits, setCredits] = useState(String(ledger.credits));
  const [donations, setDonations] = useState(
    String(ledger.charitableDonations),
  );
  const [withheld, setWithheld] = useState(String(ledger.withholdings));

  const filed: FiledReturn = useMemo(
    () => ({
      employmentIncome: parseDollars(employment),
      reportedSideIncome: parseDollars(sideIncome),
      investmentIncome: parseDollars(investment),
      deductions: parseDollars(deductions),
      credits: parseDollars(credits),
      charitableDonations: parseDollars(donations),
      withholdings: parseDollars(withheld),
    }),
    [
      credits,
      deductions,
      donations,
      employment,
      investment,
      sideIncome,
      withheld,
    ],
  );

  const preview = useMemo(
    () =>
      computeFederalReturn({
        employmentIncome: filed.employmentIncome,
        reportedSideIncome: filed.reportedSideIncome,
        investmentIncome: filed.investmentIncome,
        deductions: filed.deductions,
        tuitionAmount: filed.credits,
        charitableDonations: filed.charitableDonations,
        withholdings: filed.withholdings,
      }),
    [filed],
  );

  const tuitionCreditPreview = federalTuitionCredit(filed.credits);

  function goNext() {
    setStepIndex((index) => Math.min(STEPS.length - 1, index + 1));
  }

  function goBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-tm-gold/30 bg-black/40 px-4 py-3 backdrop-blur-md md:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-tm-green-300">
            Tax Office · Spring
          </p>
          <h1 className="font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream md:text-xl">
            File your return
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setLedgerOpen(true)}
          className="rounded-full border-2 border-tm-gold bg-tm-gold px-4 py-2 font-[family-name:var(--font-game)] text-sm font-extrabold text-tm-ink shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:brightness-105"
        >
          Year ledger
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
          <section className="rounded-2xl border-4 border-tm-green-300 bg-tm-green-900/75 p-5 shadow-2xl backdrop-blur-xl md:p-7">
            <nav className="flex flex-wrap gap-1.5">
              {STEPS.map((item, index) => {
                const active = index === stepIndex;
                const done = index < stepIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={busy}
                    onClick={() => setStepIndex(index)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
                      active
                        ? "border-tm-gold bg-tm-gold text-tm-ink"
                        : done
                          ? "border-tm-green-300/50 bg-tm-green-300/15 text-tm-green-300"
                          : "border-white/15 text-tm-cream/45"
                    }`}
                  >
                    {index + 1}. {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6">
              {step === "intro" ? (
                <div className="space-y-4">
                  <h2 className="font-[family-name:var(--font-game)] text-3xl font-extrabold text-tm-cream">
                    Ready to file?
                  </h2>
                  <p className="max-w-xl text-tm-cream/80">
                    Open the{" "}
                    <button
                      type="button"
                      onClick={() => setLedgerOpen(true)}
                      className="font-bold text-tm-gold underline"
                    >
                      Year ledger
                    </button>{" "}
                    anytime — it&apos;s your T4 and receipts. Copy each total
                    into the form carefully; wrong numbers change your refund
                    or balance owing.
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-tm-cream/70">
                    <li>Income from work, gigs, and taxable investments</li>
                    <li>Deductions (RRSP / FHSA contributions)</li>
                    <li>Eligible tuition fees and charitable donations</li>
                    <li>Tax already taken from your paycheques</li>
                  </ul>
                </div>
              ) : null}

              {step === "income" ? (
                <div className="space-y-4">
                  <h2 className="font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-cream">
                    Step 1 · Income
                  </h2>
                  <p className="text-sm text-tm-cream/70">
                    Enter what belongs on your return. Off-book tips on the
                    ledger are a warning — reporting them is honest; hiding them
                    raises audit risk from choices you already made.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MoneyField
                      label="Employment income"
                      hint="Copy from Employment (T4)"
                      value={employment}
                      onChange={setEmployment}
                      disabled={busy}
                    />
                    <MoneyField
                      label="Gig / side income"
                      hint="Copy from Gig / tips reported"
                      value={sideIncome}
                      onChange={setSideIncome}
                      disabled={busy}
                    />
                    <MoneyField
                      label="Investment income"
                      hint="Taxable interest / stubs"
                      value={investment}
                      onChange={setInvestment}
                      disabled={busy}
                    />
                  </div>
                </div>
              ) : null}

              {step === "deductions" ? (
                <div className="space-y-4">
                  <h2 className="font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-cream">
                    Step 2 · Deductions
                  </h2>
                  <p className="text-sm text-tm-cream/70">
                    RRSP and FHSA contributions lower taxable income. Enter the
                    total from your ledger.
                  </p>
                  <div className="max-w-sm">
                    <MoneyField
                      label="Registered account deductions"
                      hint="RRSP + FHSA contributions this year"
                      value={deductions}
                      onChange={setDeductions}
                      disabled={busy}
                    />
                  </div>
                </div>
              ) : null}

              {step === "credits" ? (
                <div className="space-y-4">
                  <h2 className="font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-cream">
                    Step 3 · Credits & donations
                  </h2>
                  <p className="text-sm text-tm-cream/70">
                    Enter your eligible tuition fees (the amount you paid), not
                    the credit dollars. CRA multiplies tuition by the lowest
                    federal rate ({(LOWEST_FEDERAL_RATE * 100).toFixed(1)}%).
                    Enter cash donated; the federal donation credit is calculated
                    at file.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MoneyField
                      label="Eligible tuition fees"
                      hint="Copy from Eligible tuition fees"
                      value={credits}
                      onChange={setCredits}
                      disabled={busy}
                    />
                    <MoneyField
                      label="Charitable donations"
                      hint="Cash donated (not the credit $)"
                      value={donations}
                      onChange={setDonations}
                      disabled={busy}
                    />
                  </div>
                  {parseDollars(credits) > 0 ? (
                    <p className="text-sm text-tm-green-300">
                      Federal tuition credit on what you entered: $
                      {tuitionCreditPreview.toLocaleString()} (
                      {(LOWEST_FEDERAL_RATE * 100).toFixed(1)}% × fees)
                    </p>
                  ) : null}
                  {parseDollars(donations) > 0 ? (
                    <p className="text-sm text-tm-green-300">
                      Estimated donation credit (fed. + ON) on what you entered:
                      $
                      {donationCreditBreakdown(
                        parseDollars(donations),
                      ).total.toLocaleString()}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step === "withholdings" ? (
                <div className="space-y-4">
                  <h2 className="font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-cream">
                    Step 4 · Tax already withheld
                  </h2>
                  <p className="text-sm text-tm-cream/70">
                    This is tax your employer already sent in from each
                    paycheque.
                  </p>
                  <div className="max-w-sm">
                    <MoneyField
                      label="Income tax deducted"
                      hint="Copy from Tax already withheld"
                      value={withheld}
                      onChange={setWithheld}
                      disabled={busy}
                    />
                  </div>
                </div>
              ) : null}

              {step === "review" ? (
                <div className="space-y-4">
                  <h2 className="font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-cream">
                    Step 5 · Review & file
                  </h2>
                  <p className="text-sm text-tm-cream/70">
                    Preview based on what you entered. File when it looks right.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border-2 border-tm-green-300/40 bg-black/35 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-tm-green-300">
                        You entered
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-tm-cream/80">
                        <li>
                          Employment: $
                          {filed.employmentIncome.toLocaleString()}
                        </li>
                        <li>
                          Side income: $
                          {filed.reportedSideIncome.toLocaleString()}
                        </li>
                        <li>
                          Investment: $
                          {filed.investmentIncome.toLocaleString()}
                        </li>
                        <li>
                          Deductions: ${filed.deductions.toLocaleString()}
                        </li>
                        <li>
                          Tuition fees: ${filed.credits.toLocaleString()}
                        </li>
                        <li>
                          Donations: $
                          {filed.charitableDonations.toLocaleString()}
                        </li>
                        <li>
                          Withheld: ${filed.withholdings.toLocaleString()}
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-xl border-2 border-tm-gold/50 bg-tm-gold/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-tm-gold">
                        Estimated federal result
                      </p>
                      <p className="mt-2 font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-cream">
                        {preview.refund ? "Refund" : "Balance owing"}
                      </p>
                      <p className="mt-1 text-tm-gold">
                        ${Math.abs(preview.balance).toLocaleString()}
                      </p>
                      <ul className="mt-3 space-y-1 text-xs text-tm-cream/65">
                        <li>
                          Taxable income: $
                          {preview.taxableIncome.toLocaleString()}
                        </li>
                        <li>
                          Gross federal tax: $
                          {preview.federalTax.toLocaleString()}
                        </li>
                        <li>
                          Credits applied: ${preview.credits.toLocaleString()}
                        </li>
                        <li>
                          Net federal tax: ${preview.netTax.toLocaleString()}
                        </li>
                        <li>
                          Already withheld: $
                          {preview.withholdings.toLocaleString()}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 pb-2">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={goBack}
                  className="rounded-xl border-2 border-tm-cream/25 px-5 py-2.5 font-bold text-tm-cream transition hover:border-tm-gold hover:text-tm-gold disabled:opacity-60"
                >
                  ← Back
                </button>
              ) : null}

              {step !== "review" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={goNext}
                  className="rounded-xl border-2 border-tm-gold bg-tm-gold px-5 py-2.5 font-[family-name:var(--font-game)] font-extrabold text-tm-ink disabled:opacity-60"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onFile(filed)}
                  className="rounded-xl border-2 border-tm-gold bg-tm-gold px-6 py-3 font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-ink disabled:opacity-60"
                >
                  {busy ? "Filing…" : "File return"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      {ledgerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close ledger"
            className="absolute inset-0 bg-black/55"
            onClick={() => setLedgerOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="ledger-title"
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l-4 border-tm-gold bg-tm-green-900 shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <h2
                id="ledger-title"
                className="font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream"
              >
                Year ledger
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setLedgerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-tm-cream/25 bg-black/40 font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream transition hover:border-tm-gold hover:text-tm-gold"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none p-5">
              <LedgerPanel ledger={ledger} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
