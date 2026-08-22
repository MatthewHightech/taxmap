"use client";

import { useMemo, useState } from "react";
import {
  MAX_COURSES,
  MIN_COURSES,
  tuitionOption,
  type Scenario,
} from "../../convex/content/scenarios";
import { formatEffectChips } from "../../convex/lib/ledger";

type DecisionModalProps = {
  scenario: Scenario;
  onChoose: (optionId: string) => void;
  onClose: () => void;
  busy?: boolean;
};

export function DecisionModal({
  scenario,
  onChoose,
  onClose,
  busy,
}: DecisionModalProps) {
  const isCoursePicker = scenario.id === "sept-uni-courses";

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
        aria-labelledby="decision-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border-4 border-tm-green-300 bg-tm-green-900/75 p-6 pt-12 shadow-2xl backdrop-blur-xl"
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
          {scenario.locationId}
        </p>
        <h2
          id="decision-title"
          className="mt-2 font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-cream"
        >
          {scenario.title}
        </h2>
        <p className="mt-3 text-tm-cream/85">{scenario.body}</p>

        {isCoursePicker ? (
          <CoursePickerOptions busy={busy} onChoose={onChoose} />
        ) : (
          <div className="mt-6 space-y-3">
            {scenario.options.map((option) => {
              const chips = formatEffectChips(option.effects);
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onChoose(option.id)}
                  className="w-full rounded-xl border-2 border-tm-green-300/50 bg-tm-green-900/80 px-4 py-3 text-left transition hover:border-tm-gold disabled:opacity-60"
                >
                  <div className="font-[family-name:var(--font-game)] font-bold text-tm-cream">
                    {option.label}
                  </div>
                  <div className="text-sm text-tm-cream/70">
                    {option.description}
                  </div>
                  {chips.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-tm-gold"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CoursePickerOptions({
  busy,
  onChoose,
}: {
  busy?: boolean;
  onChoose: (optionId: string) => void;
}) {
  const [courses, setCourses] = useState(4);
  const cashOption = useMemo(() => tuitionOption(courses, "cash"), [courses]);
  const loanOption = useMemo(() => tuitionOption(courses, "loan"), [courses]);
  const tuition = courses * 600;

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border-2 border-tm-green-300/40 bg-black/35 px-4 py-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-tm-green-300">
          Courses
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={busy || courses <= MIN_COURSES}
            onClick={() => setCourses((value) => Math.max(MIN_COURSES, value - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-tm-gold bg-tm-gold font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-ink disabled:opacity-40"
            aria-label="Fewer courses"
          >
            −
          </button>
          <div className="text-center">
            <div className="font-[family-name:var(--font-game)] text-4xl font-extrabold text-tm-cream">
              {courses}
            </div>
            <div className="text-sm text-tm-cream/70">
              ${tuition.toLocaleString()} tuition
            </div>
          </div>
          <button
            type="button"
            disabled={busy || courses >= MAX_COURSES}
            onClick={() => setCourses((value) => Math.min(MAX_COURSES, value + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-tm-gold bg-tm-gold font-[family-name:var(--font-game)] text-2xl font-extrabold text-tm-ink disabled:opacity-40"
            aria-label="More courses"
          >
            +
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-tm-cream/55">
          Min {MIN_COURSES} · Max {MAX_COURSES} · $600 per course
        </p>
      </div>

      {[cashOption, loanOption].map((option) => {
        const chips = formatEffectChips(option.effects);
        return (
          <button
            key={option.id}
            type="button"
            disabled={busy}
            onClick={() => onChoose(option.id)}
            className="w-full rounded-xl border-2 border-tm-green-300/50 bg-tm-green-900/80 px-4 py-3 text-left transition hover:border-tm-gold disabled:opacity-60"
          >
            <div className="font-[family-name:var(--font-game)] font-bold text-tm-cream">
              {option.label}
            </div>
            <div className="text-sm text-tm-cream/70">{option.description}</div>
            {chips.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-tm-gold"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
