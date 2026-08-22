"use client";

export type PersonaId = "student" | "single_mother" | "fisherman";

export type Persona = {
  id: PersonaId;
  title: string;
  blurb: string;
  locked: boolean;
};

export const PERSONAS: Persona[] = [
  {
    id: "student",
    title: "University Student",
    blurb: "First real income, tuition bills, and registered accounts.",
    locked: false,
  },
  {
    id: "single_mother",
    title: "Single Mother of 2",
    blurb: "Benefits, childcare, and working-income trade-offs.",
    locked: true,
  },
  {
    id: "fisherman",
    title: "Retired Fisherman",
    blurb: "Boat debt, pension income, and gear you still owe on.",
    locked: true,
  },
];

type CharacterSelectProps = {
  onSelectStudent: () => void;
};

export function CharacterSelect({ onSelectStudent }: CharacterSelectProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border-2 border-tm-gold/60 bg-tm-green-900 p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tm-green-300">
          Choose your life
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-game)] text-3xl font-extrabold text-tm-cream">
          Who are you playing as?
        </h2>
        <p className="mt-2 text-sm text-tm-cream/75">
          Only the student path is playable in this build. Other lives are coming
          soon.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {PERSONAS.map((persona) => {
            const playable = !persona.locked;
            return (
              <button
                key={persona.id}
                type="button"
                disabled={!playable}
                onClick={() => {
                  if (playable) onSelectStudent();
                }}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  playable
                    ? "border-tm-gold bg-black/40 hover:bg-tm-gold/15"
                    : "cursor-not-allowed border-white/15 bg-black/25 opacity-55"
                }`}
              >
                <div className="font-[family-name:var(--font-game)] text-lg font-extrabold text-tm-cream">
                  {persona.title}
                </div>
                <p className="mt-2 text-sm text-tm-cream/75">{persona.blurb}</p>
                <div
                  className={`mt-4 text-xs font-bold uppercase tracking-wide ${
                    playable ? "text-tm-gold" : "text-tm-cream/45"
                  }`}
                >
                  {playable ? "Playable" : "Coming soon"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
