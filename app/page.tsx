"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BriefingModal } from "../components/game/BriefingModal";
import { CharacterSelect } from "../components/game/CharacterSelect";
import { api } from "../convex/_generated/api";
import {
  clearPlaythroughId,
  usePlaythroughId,
  writePlaythroughId,
} from "../lib/playthroughStorage";
import { TOWN_IMAGE_SRC } from "../content/mapAssets";

type FlowStep = "landing" | "characters" | "briefing";

export default function HomePage() {
  const router = useRouter();
  const create = useMutation(api.playthroughs.create);
  const [step, setStep] = useState<FlowStep>("landing");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const existingId = usePlaythroughId();

  async function startStudent() {
    setBusy(true);
    setError(null);
    try {
      const id = await create({ playerName: "Student" });
      writePlaythroughId(id);
      router.push("/play");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a run");
      setBusy(false);
    }
  }

  function resume() {
    if (!existingId) return;
    router.push("/play");
  }

  function clearSave() {
    clearPlaythroughId();
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${TOWN_IMAGE_SRC})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.1)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-tm-green-900/70 via-tm-green-900/85 to-tm-green-900" />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <h1 className="mt-3 font-[family-name:var(--font-game)] text-6xl font-extrabold tracking-tight text-tm-cream drop-shadow-lg md:text-7xl">
          TaxMap
        </h1>
        <p className="mt-4 max-w-xl text-lg text-tm-cream/90">
          A game-of-life, focused on financial education through practical decision making.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => setStep("characters")}
            className="rounded-xl border-2 border-tm-gold bg-tm-gold px-6 py-3 font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-ink shadow-lg transition hover:brightness-105 disabled:opacity-60"
          >
            New Game
          </button>
          {existingId ? (
            <button
              type="button"
              disabled={busy}
              onClick={resume}
              className="rounded-xl border-2 border-tm-green-300 bg-tm-panel px-6 py-3 font-[family-name:var(--font-game)] text-lg font-bold text-tm-cream"
            >
              Resume
            </button>
          ) : null}
        </div>

        {existingId ? (
          <button
            type="button"
            onClick={clearSave}
            className="mt-4 w-fit text-sm text-tm-cream/60 underline"
          >
            Clear saved run
          </button>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-tm-danger/20 px-3 py-2 text-sm text-tm-cream">
            {error}
          </p>
        ) : null}

        <p className="mt-12 text-sm text-tm-cream/55">
          Educational simulation only, not tax advice. Not currently accepting lawsuits.
        </p>
      </div>

      {step === "characters" ? (
        <CharacterSelect onSelectStudent={() => setStep("briefing")} />
      ) : null}

      {step === "briefing" ? (
        <BriefingModal
          busy={busy}
          onBack={() => setStep("characters")}
          onConfirm={() => void startStudent()}
        />
      ) : null}
    </main>
  );
}
