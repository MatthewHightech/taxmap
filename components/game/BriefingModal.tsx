"use client";

type BriefingModalProps = {
  busy?: boolean;
  onConfirm: () => void;
  onBack: () => void;
};

export function BriefingModal({ busy, onConfirm, onBack }: BriefingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto scrollbar-none rounded-2xl border-2 border-tm-gold/60 bg-tm-green-900 p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tm-green-300">
          University Student
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-game)] text-3xl font-extrabold text-tm-cream">
          Your year starts now
        </h2>
        <p className="mt-3 text-tm-cream/85">
          Walk the town with <span className="text-tm-gold">WASD</span>, enter
          buildings with <span className="text-tm-gold">Spacebar</span> or a
          click, and
          make money choices through Summer, Fall, Winter, and Spring tax filing.
        </p>

        <div className="mt-5 space-y-2 rounded-xl border border-tm-green-300/30 bg-black/40 p-4 text-sm text-tm-cream/90">
          <p className="font-[family-name:var(--font-game)] font-bold text-tm-gold">
            Starting conditions
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
                Job salary: <strong>$12,000 / year</strong> (~$1,000 / month)
            </li>
            <li>Summer pay already deposited</li>
            <li>Starting cash buffer after that deposit</li>
            <li>No student loans yet — those show up if you borrow for tuition</li>
          </ul>
        </div>

        <p className="mt-4 text-xs text-tm-cream/55">
          Educational simulation only, not tax advice. Not currently accepting lawsuits.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-xl border-2 border-tm-gold bg-tm-gold px-5 py-2.5 font-[family-name:var(--font-game)] text-base font-extrabold text-tm-ink disabled:opacity-60"
          >
            {busy ? "Starting…" : "Start Summer"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onBack}
            className="rounded-xl border-2 border-tm-green-300/40 px-5 py-2.5 font-bold text-tm-cream"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
