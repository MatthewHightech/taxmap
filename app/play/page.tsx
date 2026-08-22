"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DecisionModal } from "../../components/game/DecisionModal";
import { BankModal } from "../../components/game/BankModal";
import { FoodBankModal } from "../../components/game/FoodBankModal";
import { Hud } from "../../components/game/Hud";
import { TaxWizard, type FiledReturn } from "../../components/game/TaxWizard";
import { TownMap } from "../../components/game/TownMap";
import { api } from "../../convex/_generated/api";
import type { BankAccountId } from "../../convex/lib/bank";
import { effectiveTaxCredits } from "../../convex/lib/donations";
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
  const [filingBusy, setFilingBusy] = useState(false);
  const create = useMutation(api.playthroughs.create);
  const applyChoice = useMutation(api.playthroughs.applyChoice);
  const bankDeposit = useMutation(api.playthroughs.bankDeposit);
  const bankLoan = useMutation(api.playthroughs.bankLoan);
  const foodBankDonate = useMutation(api.playthroughs.foodBankDonate);
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

  const unlockedLocationIds = useMemo(() => {
    if (!playthrough) return [];
    const ids = new Set(playthrough.unlockedLocationIds);
    if (playthrough.status === "playing") {
      ids.add("bank");
      ids.add("foodBank");
    }
    return [...ids];
  }, [playthrough]);

  const activeLocationIds = useMemo(() => {
    if (!playthrough || playthrough.status !== "playing") return [];
    const ids = new Set(openScenarios.map((scenario) => scenario.locationId));
    ids.add("bank");
    ids.add("foodBank");
    if (
      playthrough.season === "april" &&
      playthrough.unlockedLocationIds.includes("taxOffice")
    ) {
      ids.add("taxOffice");
    }
    return [...ids];
  }, [openScenarios, playthrough]);

  const displayCredits = useMemo(() => {
    if (!playthrough) return 0;
    return effectiveTaxCredits(
      playthrough.credits,
      playthrough.charitableDonations ?? 0,
    );
  }, [playthrough]);

  const canAdvanceSeason = useMemo(() => {
    if (!playthrough) return false;
    return seasonActivitiesComplete(
      playthrough.season,
      playthrough.completedScenarioIds,
    );
  }, [playthrough]);

  const scenarioForLocation = useMemo(() => {
    if (
      !selectedLocation ||
      selectedLocation === "bank" ||
      selectedLocation === "foodBank"
    ) {
      return null;
    }
    return (
      openScenarios.find((scenario) => scenario.locationId === selectedLocation) ??
      null
    );
  }, [openScenarios, selectedLocation]);

  const bankOpen = selectedLocation === "bank";
  const foodBankOpen = selectedLocation === "foodBank";

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

  async function onBankDeposit(
    deposits: Array<{ accountId: BankAccountId; amount: number }>,
  ) {
    if (!playthroughId) return;
    setChoiceBusy(true);
    try {
      await bankDeposit({ playthroughId, deposits });
      setSelectedLocation(null);
    } finally {
      setChoiceBusy(false);
    }
  }

  async function onBankLoan(amount: number) {
    if (!playthroughId) return;
    setChoiceBusy(true);
    try {
      await bankLoan({ playthroughId, amount });
      setSelectedLocation(null);
    } finally {
      setChoiceBusy(false);
    }
  }

  async function onFoodBankDonate(amount: number) {
    if (!playthroughId) return;
    setChoiceBusy(true);
    try {
      await foodBankDonate({ playthroughId, amount });
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

  async function onFile(filed: FiledReturn) {
    if (!playthroughId) return;
    setFilingBusy(true);
    try {
      await submitReturn({
        playthroughId,
        ...filed,
      });
    } finally {
      setFilingBusy(false);
    }
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TaxWizard
          busy={filingBusy}
          onFile={(filed) => void onFile(filed)}
          ledger={{
            employmentIncome: playthrough.employmentIncome,
            reportedSideIncome: playthrough.reportedSideIncome,
            unreportedSideIncome: playthrough.unreportedSideIncome,
            investmentIncome: playthrough.investmentIncome,
            deductions: playthrough.deductions,
            credits: playthrough.credits,
            charitableDonations: playthrough.charitableDonations ?? 0,
            withholdings: playthrough.withholdings,
            auditRisk: playthrough.auditRisk,
          }}
        />
      </div>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <TownMap
          unlockedLocationIds={unlockedLocationIds}
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
          savings={playthrough.investments}
          deductions={playthrough.deductions}
          credits={displayCredits}
          canAdvanceSeason={canAdvanceSeason}
          onAdvanceSeason={() => void onAdvanceSeason()}
          advancing={advancing}
        />
      </div>

      {bankOpen && playthrough ? (
        <BankModal
          cash={playthrough.cash}
          investments={playthrough.investments}
          hisaBalance={playthrough.hisaBalance}
          tfsaBalance={playthrough.tfsaBalance}
          rrspBalance={playthrough.rrspBalance}
          fhsaBalance={playthrough.fhsaBalance}
          busy={choiceBusy}
          onDeposit={(deposits) => void onBankDeposit(deposits)}
          onLoan={(amount) => void onBankLoan(amount)}
          onClose={() => setSelectedLocation(null)}
        />
      ) : foodBankOpen && playthrough ? (
        <FoodBankModal
          cash={playthrough.cash}
          charitableDonations={playthrough.charitableDonations}
          busy={choiceBusy}
          onDonate={(amount) => void onFoodBankDonate(amount)}
          onClose={() => setSelectedLocation(null)}
        />
      ) : scenarioForLocation ? (
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
