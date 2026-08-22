type HudProps = {
  seasonLabel: string;
  cash: number;
  netWorth: number;
  deductions: number;
  credits: number;
  auditRisk: number;
};

function Chip({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border-2 px-3 py-1.5 shadow-md ${
        warn
          ? "border-tm-danger bg-tm-danger/20"
          : "border-tm-gold/70 bg-tm-panel"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide text-tm-green-300">
        {label}
      </div>
      <div className="font-[family-name:var(--font-game)] text-sm font-extrabold text-tm-cream">
        {value}
      </div>
    </div>
  );
}

export function Hud({
  seasonLabel,
  cash,
  netWorth,
  deductions,
  credits,
  auditRisk,
}: HudProps) {
  return (
    <header className="z-20 flex flex-wrap items-center gap-3 border-b-4 border-tm-green-700 bg-tm-green-900/95 px-4 py-3">
      <div className="mr-auto">
        <div className="font-[family-name:var(--font-game)] text-xl font-extrabold tracking-tight text-tm-gold">
          TaxMap
        </div>
        <div className="text-xs font-semibold text-tm-green-300">{seasonLabel}</div>
      </div>
      <Chip label="Cash" value={`$${Math.round(cash).toLocaleString()}`} />
      <Chip
        label="Net Worth"
        value={`$${Math.round(netWorth).toLocaleString()}`}
      />
      <Chip label="Deductions" value={`$${Math.round(deductions).toLocaleString()}`} />
      <Chip label="Credits" value={`$${Math.round(credits).toLocaleString()}`} />
      <Chip
        label="Audit Risk"
        value={`${Math.round(auditRisk)}%`}
        warn={auditRisk >= 25}
      />
    </header>
  );
}
