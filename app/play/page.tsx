"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DecisionModal } from "../../components/game/DecisionModal";
import { Hud } from "../../components/game/Hud";
import { TownMap } from "../../components/game/TownMap";
import { api } from "../../convex/_generated/api";
import { scenariosForSeason } from "../../convex/content/scenarios";
import { seasonActivitiesComplete } from "../../convex/lib/seasons";
import {
  clearPlaythroughId,
  useIsClient,
  usePlaythroughId,
  writePlaythroughId,
} from "../../lib/playthroughStorage";

export default function PlayPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const playthroughId = usePlaythroughId();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [choiceBusy, setChoiceBusy] = useState(false);
  const create = useMutation(api.playthroughs.create);
  const applyChoice = useMutation(api.playthroughs.applyChoice);
  const advanceSeason = useMutation(api.playthroughs.advanceSeason);
  const startFiling = useMutation(api.playthroughs.startFiling);
  const submitReturn = useMutation(api.playthroughs.submitReturn);

  const playthrough = useQuery(
    api.playthroughs.get,
    playthroughId ? { playthroughId } : "skip",
  );

  const openScenarios = useMemo(() => {
    if (!playthrough) return [];
    return scenariosForSeason(playthrough.season).filter(
      (scenario) =>
        !playthrough.completedScenarioIds.includes(scenario.id) &&
        playthrough.unlockedLocationIds.includes(scenario.locationId),
    );
  }, [playthrough]);

  const activeLocationIds = useMemo(() => {
    if (!playthrough) return [];
    const fromScenarios = openScenarios.map((scenario) => scenario.locationId);
    if (
      playthrough.season === "april" &&
      playthrough.status === "playing" &&
      playthrough.unlockedLocationIds.includes("taxOffice")
    ) {
      return [...fromScenarios, "taxOffice"];
    }
    return fromScenarios;
  }, [openScenarios, playthrough]);

  const canAdvanceSeason = useMemo(() => {
    if (!playthrough) return false;
    return seasonActivitiesComplete(
      playthrough.season,
      playthrough.completedScenarioIds,
    );
  }, [playthrough]);

  const scenarioForLocation = useMemo(() => {
    if (!selectedLocation) return null;
    return (
      openScenarios.find((scenario) => scenario.locationId === selectedLocation) ??
      null
    );
  }, [openScenarios, selectedLocation]);

  async function onChoose(optionId: string) {
    if (!playthroughId || !scenarioForLocation) return;
    setChoiceBusy(true);
    try {
      await applyChoice({
        playthroughId,
        scenarioId: scenarioForLocation.id,
        optionId,
      });
      setSelectedLocation(null);
    } finally {
      setChoiceBusy(false);
    }
  }

  async function onTaxOffice() {
    if (!playthroughId || !playthrough) return;
    if (playthrough.status === "playing" && playthrough.season === "april") {
      await startFiling({ playthroughId });
    }
  }

  async function onFile() {
    if (!playthroughId) return;
    await submitReturn({ playthroughId });
  }

  async function playAgain() {
    clearPlaythroughId();
    const id = await create({});
    writePlaythroughId(id);
    router.replace("/play");
  }

  async function onAdvanceSeason() {
    if (!playthroughId) return;
    setAdvancing(true);
    try {
      await advanceSeason({ playthroughId });
      setSelectedLocation(null);
    } finally {
      setAdvancing(false);
    }
  }

  // During SSR/hydration, always render the same loading shell to avoid mismatches
  // with localStorage-backed playthrough ids.
  if (!isClient) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-tm-cream">
        Loading your town…
      </main>
    );
  }

  if (!playthroughId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-tm-cream">
        <p>No saved run yet.</p>
        <Link
          href="/"
          className="rounded-lg bg-tm-gold px-4 py-2 font-bold text-tm-ink"
        >
          Start from home
        </Link>
      </main>
    );
  }

  if (playthrough === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-tm-cream">
        Loading your town…
      </main>
    );
  }

  if (playthrough === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-tm-cream">
        <p>Saved run not found.</p>
        <button
          type="button"
          className="rounded-lg bg-tm-gold px-4 py-2 font-bold text-tm-ink"
          onClick={() => {
            clearPlaythroughId();
            router.push("/");
          }}
        >
          Start fresh
        </button>
      </main>
    );
  }

  if (playthrough.status === "complete") {
    const snap = playthrough.filingSnapshot;
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-12">
        <div className="rounded-2xl border-4 border-tm-gold bg-tm-panel p-8 shadow-2xl">
          <p className="font-[family-name:var(--font-game)] text-sm uppercase tracking-widest text-tm-green-300">
            Results
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-game)] text-4xl font-extrabold text-tm-cream">
            {snap?.refund ? "REFUND" : "BALANCE OWING"}
          </h1>
          <p className="mt-2 text-tm-cream/80">
            {snap
              ? snap.refund
                ? `You get $${Math.abs(snap.balance).toLocaleString()} back.`
                : `You owe $${snap.balance.toLocaleString()}.`
              : null}
          </p>
          <p className="mt-6 font-[family-name:var(--font-game)] text-2xl text-tm-gold">
            Score: {playthrough.score ?? "—"}
          </p>
          <p className="mt-2 text-sm text-tm-cream/70">
            Audit: {playthrough.auditResult ?? "none"}
          </p>
          <button
            type="button"
            onClick={() => void playAgain()}
            className="mt-8 rounded-xl bg-tm-gold px-6 py-3 font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-ink"
          >
            Play Again
          </button>
        </div>
        <Link href="/" className="text-center text-tm-cream/60 underline">
          Back home
        </Link>
      </main>
    );
  }

  if (playthrough.status === "filing") {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 gap-0 px-4 py-8 md:px-8">
        <aside className="w-56 shrink-0 rounded-l-2xl border border-r-0 border-tm-green-300/30 bg-white p-4 text-tm-ink">
          <p className="text-xs font-semibold uppercase tracking-wide text-tm-green-700">
            File your return
          </p>
          <ol className="mt-4 space-y-2 text-sm font-semibold">
            <li className="text-tm-green-700">1. Income</li>
            <li>2. Deductions</li>
            <li>3. Credits</li>
            <li>4. Review</li>
            <li>5. File</li>
          </ol>
        </aside>
        <section className="flex-1 rounded-r-2xl border border-tm-green-300/30 bg-tm-cream p-6 text-tm-ink">
          <h2 className="font-[family-name:var(--font-game)] text-2xl font-bold">
            Review (scaffold)
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Employment: ${playthrough.employmentIncome.toLocaleString()}</li>
            <li>
              Reported side: ${playthrough.reportedSideIncome.toLocaleString()}
            </li>
            <li>Deductions: ${playthrough.deductions.toLocaleString()}</li>
            <li>Credits: ${playthrough.credits.toLocaleString()}</li>
            <li>Withholdings: ${playthrough.withholdings.toLocaleString()}</li>
            <li>Audit risk: {playthrough.auditRisk}%</li>
          </ul>
          <p className="mt-4 text-xs text-tm-ink/60">
            Educational simulation only — not tax advice.
          </p>
          <button
            type="button"
            onClick={() => void onFile()}
            className="mt-6 rounded-xl bg-tm-green-700 px-5 py-3 font-bold text-white"
          >
            File return
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <TownMap
          unlockedLocationIds={playthrough.unlockedLocationIds}
          activeLocationIds={activeLocationIds}
          onSelectLocation={(locationId) => {
            if (locationId === "taxOffice" && playthrough.season === "april") {
              void onTaxOffice();
              return;
            }
            setSelectedLocation(locationId);
          }}
        />
        <Hud
          season={playthrough.season}
          cash={playthrough.cash}
          debt={playthrough.debt}
          deductions={playthrough.deductions}
          credits={playthrough.credits}
          canAdvanceSeason={canAdvanceSeason}
          onAdvanceSeason={() => void onAdvanceSeason()}
          advancing={advancing}
        />
      </div>

      {scenarioForLocation ? (
        <DecisionModal
          scenario={scenarioForLocation}
          busy={choiceBusy}
          onChoose={(optionId) => void onChoose(optionId)}
          onClose={() => setSelectedLocation(null)}
        />
      ) : selectedLocation ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={() => setSelectedLocation(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl border-2 border-tm-green-300/50 bg-tm-green-900/75 p-6 pt-12 text-center shadow-2xl backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelectedLocation(null)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-tm-cream/25 bg-black/40 font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream transition hover:border-tm-gold hover:text-tm-gold"
            >
              ×
            </button>
            <p className="font-[family-name:var(--font-game)] text-lg font-bold text-tm-cream">
              Nothing left to do here this season.
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
