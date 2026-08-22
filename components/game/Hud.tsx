"use client";

import type { Season } from "../../convex/lib/seasons";
import { nextSeason, SEASON_LABELS } from "../../convex/lib/seasons";

export type RequiredActivity = {
  id: string;
  label: string;
  done: boolean;
};

type GameHudProps = {
  season: Season;
  cash: number;
  debt: number;
  savings: number;
  deductions: number;
  credits: number;
  requiredActivities: RequiredActivity[];
  canAdvanceSeason: boolean;
  onAdvanceSeason: () => void;
  advancing?: boolean;
};

function MoneyBubble({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "gold" | "green" | "cream";
}) {
  const accentClass =
    accent === "gold"
      ? "border-tm-gold/80 text-tm-gold"
      : accent === "cream"
        ? "border-tm-cream/50 text-tm-cream"
        : "border-tm-green-300/70 text-tm-green-300";

  return (
    <div
      className={`pointer-events-auto rounded-full border-2 bg-black/75 px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md ${accentClass}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-tm-cream/80">
        {label}
      </div>
      <div className="font-[family-name:var(--font-game)] text-base font-extrabold leading-tight text-tm-cream">
        ${Math.round(value).toLocaleString()}
      </div>
    </div>
  );
}

export function Hud({
  season,
  cash,
  debt,
  savings,
  deductions,
  credits,
  requiredActivities,
  canAdvanceSeason,
  onAdvanceSeason,
  advancing = false,
}: GameHudProps) {
  const upcoming = nextSeason(season);
  const showAdvance = upcoming !== null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div className="absolute left-4 top-4 flex max-w-[min(100%-2rem,22rem)] flex-col items-start gap-2">
        <div className="flex items-start gap-2">
          <div className="pointer-events-auto rounded-2xl border-2 border-tm-gold/70 bg-black/75 px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-tm-green-300">
              Season
            </div>
            <div className="font-[family-name:var(--font-game)] text-lg font-extrabold leading-tight text-tm-cream md:text-xl">
              {SEASON_LABELS[season]}
            </div>

            {requiredActivities.length > 0 ? (
              <div className="mt-3 border-t border-white/15 pt-2.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-tm-cream/55">
                  Required activities
                </div>
                <ul className="mt-1.5 space-y-1">
                  {requiredActivities.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-start gap-2 text-sm leading-snug"
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 text-[10px] font-extrabold ${
                          activity.done
                            ? "border-tm-gold bg-tm-gold text-tm-ink"
                            : "border-tm-cream/35 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={
                          activity.done
                            ? "text-tm-cream/45 line-through"
                            : "text-tm-cream"
                        }
                      >
                        {activity.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {showAdvance ? (
            <button
              type="button"
              disabled={!canAdvanceSeason || advancing}
              onClick={onAdvanceSeason}
              className="pointer-events-auto self-start rounded-full border-2 border-tm-gold bg-tm-gold px-4 py-2.5 font-[family-name:var(--font-game)] text-sm font-extrabold text-tm-ink shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:border-white/25 disabled:bg-white/20 disabled:text-tm-cream/50 disabled:shadow-none"
              title={
                !canAdvanceSeason
                  ? "Finish every activity this season first"
                  : upcoming
                    ? `Jump to ${SEASON_LABELS[upcoming]}`
                    : "Next season"
              }
            >
              {advancing ? "…" : "Next →"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="absolute right-4 top-4 flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <MoneyBubble label="Cash" value={cash} accent="gold" />
        <MoneyBubble label="Savings" value={savings} accent="green" />
        <MoneyBubble label="Debt" value={debt} accent="cream" />
        <MoneyBubble label="Credits" value={credits} accent="cream" />
        <MoneyBubble label="Deductions" value={deductions} accent="cream" />
      </div>
    </div>
  );
}
