"use client";

import { useMemo, useState } from "react";
import {
  BANK_ACCOUNTS,
  LOAN_TERMS,
  balancesFromDoc,
  emptyBankBalances,
  loanDebtForPrincipal,
  type BankAccountId,
  type BankBalances,
} from "../../convex/lib/bank";

type BankView = "menu" | "deposit" | "loan";

type BankModalProps = {
  cash: number;
  hisaBalance?: number;
  tfsaBalance?: number;
  rrspBalance?: number;
  fhsaBalance?: number;
  investments: number;
  busy?: boolean;
  onDeposit: (deposits: Array<{ accountId: BankAccountId; amount: number }>) => void;
  onLoan: (amount: number) => void;
  onClose: () => void;
};

function parseDollars(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export function BankModal({
  cash,
  hisaBalance,
  tfsaBalance,
  rrspBalance,
  fhsaBalance,
  investments,
  busy,
  onDeposit,
  onLoan,
  onClose,
}: BankModalProps) {
  const [view, setView] = useState<BankView>("menu");
  const [amounts, setAmounts] = useState<BankBalances>(emptyBankBalances);
  const [loanRaw, setLoanRaw] = useState("1000");
  const [error, setError] = useState<string | null>(null);

  const balances = useMemo(
    () =>
      balancesFromDoc({
        hisaBalance,
        tfsaBalance,
        rrspBalance,
        fhsaBalance,
        investments,
      }),
    [fhsaBalance, hisaBalance, investments, rrspBalance, tfsaBalance],
  );

  const depositTotal = useMemo(
    () =>
      BANK_ACCOUNTS.reduce((sum, account) => sum + (amounts[account.id] || 0), 0),
    [amounts],
  );

  const loanAmount = parseDollars(loanRaw);
  const loanDebt = loanDebtForPrincipal(loanAmount);

  function setAccountAmount(id: BankAccountId, raw: string) {
    setError(null);
    setAmounts((current) => ({
      ...current,
      [id]: parseDollars(raw),
    }));
  }

  function submitDeposit() {
    if (depositTotal <= 0) {
      setError("Enter at least one deposit amount.");
      return;
    }
    if (depositTotal > cash) {
      setError(`You only have $${cash.toLocaleString()} cash.`);
      return;
    }
    onDeposit(
      BANK_ACCOUNTS.map((account) => ({
        accountId: account.id,
        amount: amounts[account.id],
      })).filter((row) => row.amount > 0),
    );
  }

  function submitLoan() {
    if (loanAmount < LOAN_TERMS.minAmount) {
      setError(`Minimum loan is $${LOAN_TERMS.minAmount}.`);
      return;
    }
    if (loanAmount > LOAN_TERMS.maxAmount) {
      setError(`Maximum loan is $${LOAN_TERMS.maxAmount.toLocaleString()}.`);
      return;
    }
    onLoan(loanAmount);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={() => {
        if (!busy) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-auto scrollbar-none rounded-2xl border-4 border-tm-green-300 bg-tm-green-900/75 p-6 pt-12 shadow-2xl backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label={view === "menu" ? "Close" : "Back"}
          disabled={busy}
          onClick={() => {
            if (view === "menu") {
              onClose();
              return;
            }
            setError(null);
            setView("menu");
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-tm-cream/25 bg-black/40 font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream transition hover:border-tm-gold hover:text-tm-gold disabled:opacity-60"
        >
          {view === "menu" ? "×" : "←"}
        </button>

        <p className="text-xs font-bold uppercase tracking-widest text-tm-green-300">
          Bank
        </p>
        <h2
          id="bank-title"
          className="mt-2 font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-cream"
        >
          {view === "menu"
            ? "What do you need?"
            : view === "deposit"
              ? "Deposit money"
              : "Take out a loan"}
        </h2>
        <p className="mt-2 text-sm text-tm-cream/80">
          Available cash:{" "}
          <span className="font-bold text-tm-gold">
            ${cash.toLocaleString()}
          </span>
        </p>

        {view === "menu" ? (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError(null);
                setView("deposit");
              }}
              className="w-full rounded-xl border-2 border-tm-gold bg-tm-gold/15 px-4 py-4 text-left transition hover:bg-tm-gold/25 disabled:opacity-60"
            >
              <div className="font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream">
                Deposit Money
              </div>
              <p className="mt-1 text-sm text-tm-cream/70">
                Fund your HISA, TFSA, RRSP, and FHSA — deposit into as many as you
                want.
              </p>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError(null);
                setView("loan");
              }}
              className="w-full rounded-xl border-2 border-tm-green-300/50 bg-tm-green-900/80 px-4 py-4 text-left transition hover:border-tm-gold disabled:opacity-60"
            >
              <div className="font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream">
                Take out Loan
              </div>
              <p className="mt-1 text-sm text-tm-cream/70">
                Borrow cash now. A 10% fee is added to your debt.
              </p>
            </button>
          </div>
        ) : null}

        {view === "deposit" ? (
          <div className="mt-5 space-y-3">
            {BANK_ACCOUNTS.map((account) => {
              const balance = balances[account.id];
              return (
                <label
                  key={account.id}
                  className="block rounded-xl border-2 border-tm-green-300/40 bg-black/35 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-[family-name:var(--font-game)] font-bold text-tm-cream">
                        {account.shortLabel}
                      </div>
                      <p className="mt-0.5 text-xs text-tm-cream/65">
                        {account.blurb}
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-tm-green-300">
                        Balance ${balance.toLocaleString()}
                        {account.deductible ? " · Deductible" : ""}
                      </p>
                    </div>
                    <div className="w-28 shrink-0">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-tm-cream/55">
                        Deposit $
                      </div>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        disabled={busy}
                        value={amounts[account.id] || ""}
                        placeholder="0"
                        onChange={(event) =>
                          setAccountAmount(account.id, event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border-2 border-tm-cream/20 bg-black/50 px-2 py-2 font-[family-name:var(--font-game)] text-tm-cream outline-none focus:border-tm-gold"
                      />
                    </div>
                  </div>
                </label>
              );
            })}

            <div className="flex items-center justify-between text-sm text-tm-cream/80">
              <span>Total deposit</span>
              <span
                className={`font-[family-name:var(--font-game)] font-extrabold ${
                  depositTotal > cash ? "text-red-300" : "text-tm-gold"
                }`}
              >
                ${depositTotal.toLocaleString()}
              </span>
            </div>

            {error ? (
              <p className="text-sm font-semibold text-red-300">{error}</p>
            ) : null}

            <button
              type="button"
              disabled={busy || depositTotal <= 0 || depositTotal > cash}
              onClick={submitDeposit}
              className="w-full rounded-xl border-2 border-tm-gold bg-tm-gold px-4 py-3 font-[family-name:var(--font-game)] font-extrabold text-tm-ink disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy ? "Depositing…" : "Confirm deposits"}
            </button>
          </div>
        ) : null}

        {view === "loan" ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border-2 border-tm-green-300/40 bg-black/35 px-4 py-4">
              <p className="font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream">
                {LOAN_TERMS.title}
              </p>
              <p className="mt-2 text-sm text-tm-cream/75">{LOAN_TERMS.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-tm-cream/70">
                {LOAN_TERMS.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-tm-cream/55">
                Rate: {(LOAN_TERMS.interestRate * 100).toFixed(0)}% flat fee · Min $
                {LOAN_TERMS.minAmount} · Max $
                {LOAN_TERMS.maxAmount.toLocaleString()}
              </p>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-tm-cream/60">
                Loan amount ($)
              </span>
              <input
                type="number"
                min={LOAN_TERMS.minAmount}
                max={LOAN_TERMS.maxAmount}
                step={50}
                inputMode="numeric"
                disabled={busy}
                value={loanRaw}
                onChange={(event) => {
                  setError(null);
                  setLoanRaw(event.target.value);
                }}
                className="mt-1 w-full rounded-xl border-2 border-tm-cream/20 bg-black/50 px-3 py-3 font-[family-name:var(--font-game)] text-xl text-tm-cream outline-none focus:border-tm-gold"
              />
            </label>

            <div className="rounded-xl border border-tm-gold/40 bg-tm-gold/10 px-4 py-3 text-sm text-tm-cream/85">
              <div className="flex justify-between">
                <span>You receive</span>
                <span className="font-bold text-tm-gold">
                  ${loanAmount.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Debt added (incl. fee)</span>
                <span className="font-bold text-tm-cream">
                  ${loanDebt.toLocaleString()}
                </span>
              </div>
            </div>

            {error ? (
              <p className="text-sm font-semibold text-red-300">{error}</p>
            ) : null}

            <button
              type="button"
              disabled={
                busy ||
                loanAmount < LOAN_TERMS.minAmount ||
                loanAmount > LOAN_TERMS.maxAmount
              }
              onClick={submitLoan}
              className="w-full rounded-xl border-2 border-tm-gold bg-tm-gold px-4 py-3 font-[family-name:var(--font-game)] font-extrabold text-tm-ink disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy ? "Processing…" : "Confirm loan"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
