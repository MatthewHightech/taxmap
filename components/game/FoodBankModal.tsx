"use client";

import { useMemo, useState } from "react";
import {
  DONATION_FIRST_BRACKET,
  FEDERAL_HIGH_RATE,
  FEDERAL_LOW_RATE,
  federalDonationCredit,
} from "../../convex/lib/donations";

type FoodBankModalProps = {
  cash: number;
  charitableDonations?: number;
  busy?: boolean;
  onDonate: (amount: number) => void;
  onClose: () => void;
};

const PRESETS = [25, 50, 100, 200] as const;

function parseDollars(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export function FoodBankModal({
  cash,
  charitableDonations = 0,
  busy,
  onDonate,
  onClose,
}: FoodBankModalProps) {
  const [amountRaw, setAmountRaw] = useState("50");
  const [error, setError] = useState<string | null>(null);

  const amount = parseDollars(amountRaw);

  // Match filing: federal donation credit only (sim is federal T1).
  const preview = useMemo(() => {
    const before = federalDonationCredit(charitableDonations);
    const after = federalDonationCredit(charitableDonations + amount);
    return {
      before,
      after,
      creditAdded: after - before,
    };
  }, [amount, charitableDonations]);

  function submit() {
    if (amount <= 0) {
      setError("Enter a donation amount.");
      return;
    }
    if (amount > cash) {
      setError(`You only have $${cash.toLocaleString()} cash.`);
      return;
    }
    onDonate(amount);
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
        aria-labelledby="food-bank-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-auto scrollbar-none rounded-2xl border-4 border-tm-green-300 bg-tm-green-900/75 p-6 pt-12 shadow-2xl backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          disabled={busy}
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-tm-cream/25 bg-black/40 font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream transition hover:border-tm-gold hover:text-tm-gold disabled:opacity-60"
        >
          ×
        </button>

        <p className="text-xs font-bold uppercase tracking-widest text-tm-green-300">
          Food Bank
        </p>
        <h2
          id="food-bank-title"
          className="mt-2 font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-cream"
        >
          Make a donation
        </h2>
        <p className="mt-2 text-sm text-tm-cream/80">
          Optional every season — cash donations earn a Canadian charitable
          donation tax credit at filing. Available cash:{" "}
          <span className="font-bold text-tm-gold">
            ${cash.toLocaleString()}
          </span>
        </p>

        {charitableDonations > 0 ? (
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-tm-green-300">
            Donated this year: ${charitableDonations.toLocaleString()} · Federal
            credit so far ${preview.before.toLocaleString()}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={busy || preset > cash}
              onClick={() => {
                setError(null);
                setAmountRaw(String(preset));
              }}
              className={`rounded-lg border-2 px-3 py-2 font-[family-name:var(--font-game)] text-sm font-extrabold transition disabled:opacity-40 ${
                amount === preset
                  ? "border-tm-gold bg-tm-gold text-tm-ink"
                  : "border-tm-cream/25 bg-black/35 text-tm-cream hover:border-tm-gold"
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-tm-cream/60">
            Custom amount ($)
          </span>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            disabled={busy}
            value={amountRaw}
            onChange={(event) => {
              setError(null);
              setAmountRaw(event.target.value);
            }}
            className="mt-1 w-full rounded-xl border-2 border-tm-cream/20 bg-black/50 px-3 py-3 font-[family-name:var(--font-game)] text-xl text-tm-cream outline-none focus:border-tm-gold"
          />
        </label>

        <div className="mt-4 rounded-xl border border-tm-gold/40 bg-tm-gold/10 px-4 py-3 text-sm text-tm-cream/85">
          <p className="text-[10px] font-bold uppercase tracking-wide text-tm-gold">
            Federal tax credit preview (this gift)
          </p>
          <div className="mt-2 flex justify-between border-t border-tm-cream/15 pt-2">
            <span>Federal credit added</span>
            <span className="font-bold text-tm-gold">
              +${preview.creditAdded.toLocaleString()}
            </span>
          </div>
          <p className="mt-3 text-xs text-tm-cream/55">
            First ${DONATION_FIRST_BRACKET} of yearly donations ×{" "}
            {(FEDERAL_LOW_RATE * 100).toFixed(1)}% federal; remainder ×{" "}
            {(FEDERAL_HIGH_RATE * 100).toFixed(0)}%. Matches Spring filing
            (federal only). Educational sim only.
          </p>
        </div>

        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-300">{error}</p>
        ) : null}

        <button
          type="button"
          disabled={busy || amount <= 0 || amount > cash}
          onClick={submit}
          className="mt-5 w-full rounded-xl border-2 border-tm-gold bg-tm-gold px-4 py-3 font-[family-name:var(--font-game)] font-extrabold text-tm-ink disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? "Donating…" : `Donate $${amount.toLocaleString()}`}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="mt-3 w-full rounded-xl border-2 border-tm-cream/25 bg-transparent px-4 py-3 font-[family-name:var(--font-game)] font-bold text-tm-cream/80 transition hover:border-tm-cream/50 disabled:opacity-60"
        >
          Leave without donating
        </button>
      </div>
    </div>
  );
}
