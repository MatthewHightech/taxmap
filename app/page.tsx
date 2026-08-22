"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../convex/_generated/api";
import {
  clearPlaythroughId,
  usePlaythroughId,
  writePlaythroughId,
} from "../lib/playthroughStorage";

export default function HomePage() {
  const router = useRouter();
  const create = useMutation(api.playthroughs.create);
  const seedDemo = useMutation(api.playthroughs.seedDemo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const existingId = usePlaythroughId();

  async function startNew() {
    setBusy(true);
    setError(null);
    try {
      const id = await create({});
      writePlaythroughId(id);
      router.push("/play");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a run");
      setBusy(false);
    }
  }

  async function startDemo() {
    setBusy(true);
    setError(null);
    try {
      const id = await seedDemo({});
      writePlaythroughId(id);
      router.push("/play?demo=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not seed demo");
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
          backgroundImage: "url(/assets/town.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.1)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-tm-green-900/70 via-tm-green-900/85 to-tm-green-900" />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <p className="font-[family-name:var(--font-game)] text-sm font-bold uppercase tracking-[0.2em] text-tm-green-300">
          Cursor Codechella · Victoria
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-game)] text-6xl font-extrabold tracking-tight text-tm-cream drop-shadow-lg md:text-7xl">
          TaxMap
        </h1>
        <p className="mt-4 max-w-xl text-lg text-tm-cream/90">
          A cozy town where every choice hits your cash, credits, and audit risk —
          then April turns it into a real filing moment.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startNew()}
            className="rounded-xl border-2 border-tm-gold bg-tm-gold px-6 py-3 font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-ink shadow-lg transition hover:brightness-105 disabled:opacity-60"
          >
            {busy ? "Starting…" : "New Game"}
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
          <button
            type="button"
            disabled={busy}
            onClick={() => void startDemo()}
            className="rounded-xl border-2 border-tm-green-300/60 bg-transparent px-6 py-3 font-[family-name:var(--font-game)] text-lg font-bold text-tm-cream/90"
          >
            Judge Demo
          </button>
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
          Educational simulation only — not tax advice.{" "}
          <Link href="/play" className="underline">
            Skip to play shell
          </Link>
        </p>
      </div>
    </main>
  );
}
