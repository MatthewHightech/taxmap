"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HOTSPOTS, type Hotspot } from "../../content/hotspots";
import { TOWN_IMAGE_OPTIONS, TOWN_IMAGE_SRC } from "../../content/mapAssets";

type DragMode = "move" | "resize";

type DragState = {
  id: string;
  mode: DragMode;
  startX: number;
  startY: number;
  orig: Hotspot;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function formatHotspotsTs(spots: Hotspot[]): string {
  const lines = spots.map((spot) => {
    const x = Math.round(spot.x * 10) / 10;
    const y = Math.round(spot.y * 10) / 10;
    const w = Math.round(spot.w * 10) / 10;
    const h = Math.round(spot.h * 10) / 10;
    return `  { id: "${spot.id}", label: "${spot.label}", x: ${x}, y: ${y}, w: ${w}, h: ${h} },`;
  });

  return `export const HOTSPOTS: Hotspot[] = [\n${lines.join("\n")}\n];`;
}

export default function CalibratePage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<Hotspot[]>(() =>
    HOTSPOTS.map((spot) => ({ ...spot })),
  );
  const [selectedId, setSelectedId] = useState<string>(HOTSPOTS[0]?.id ?? "");
  const [imageSrc, setImageSrc] = useState<string>(TOWN_IMAGE_SRC);
  const [copied, setCopied] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  const clientToPercent = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = ((event.clientX - drag.startX) / rect.width) * 100;
      const dy = ((event.clientY - drag.startY) / rect.height) * 100;

      setSpots((prev) =>
        prev.map((spot) => {
          if (spot.id !== drag.id) return spot;
          if (drag.mode === "move") {
            return {
              ...spot,
              x: clamp(drag.orig.x + dx, 0, 100 - spot.w),
              y: clamp(drag.orig.y + dy, 0, 100 - spot.h),
            };
          }
          return {
            ...spot,
            w: clamp(drag.orig.w + dx, 2, 100 - spot.x),
            h: clamp(drag.orig.h + dy, 2, 100 - spot.y),
          };
        }),
      );
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  async function copyConfig() {
    const text = formatHotspotsTs(spots);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const selected = spots.find((spot) => spot.id === selectedId);

  return (
    <main className="flex h-full min-h-0 flex-1 flex-col bg-tm-green-900 text-tm-cream">
      <header className="flex flex-wrap items-center gap-3 border-b border-tm-green-700 px-4 py-3">
        <div>
          <h1 className="font-[family-name:var(--font-game)] text-xl font-extrabold text-tm-gold">
            Hotspot calibrator
          </h1>
          <p className="text-xs text-tm-cream/70">
            Drag boxes to move · drag the corner handle to resize · Copy → paste
            into <code className="text-tm-green-300">content/hotspots.ts</code>
          </p>
        </div>

        <label className="ml-auto flex items-center gap-2 text-sm">
          Map
          <select
            className="rounded-lg border border-tm-green-300/40 bg-tm-panel px-2 py-1"
            value={imageSrc}
            onChange={(event) => setImageSrc(event.target.value)}
          >
            {TOWN_IMAGE_OPTIONS.map((option) => (
              <option key={option.src} value={option.src}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => void copyConfig()}
          className="rounded-xl border-2 border-tm-gold bg-tm-gold px-4 py-2 font-[family-name:var(--font-game)] text-sm font-extrabold text-tm-ink"
        >
          {copied ? "Copied!" : "Copy config"}
        </button>

        <a
          href="/play"
          className="rounded-xl border-2 border-tm-green-300/50 px-4 py-2 text-sm font-bold"
        >
          Back to play
        </a>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="max-h-48 shrink-0 overflow-auto border-b border-tm-green-700 p-3 lg:max-h-none lg:w-64 lg:border-b-0 lg:border-r">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-tm-green-300">
            Locations
          </p>
          <ul className="space-y-1">
            {spots.map((spot) => (
              <li key={spot.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(spot.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selectedId === spot.id
                      ? "bg-tm-gold text-tm-ink"
                      : "bg-tm-panel hover:bg-tm-green-700"
                  }`}
                >
                  <div className="font-bold">{spot.label}</div>
                  <div className="font-mono text-[10px] opacity-80">
                    x:{spot.x.toFixed(1)} y:{spot.y.toFixed(1)} w:
                    {spot.w.toFixed(1)} h:{spot.h.toFixed(1)}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {(["x", "y", "w", "h"] as const).map((key) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="uppercase text-tm-cream/60">{key}</span>
                  <input
                    type="number"
                    step={0.5}
                    className="rounded border border-tm-green-300/40 bg-tm-panel px-2 py-1"
                    value={Number(selected[key].toFixed(1))}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isNaN(value)) return;
                      setSpots((prev) =>
                        prev.map((spot) =>
                          spot.id === selected.id
                            ? { ...spot, [key]: value }
                            : spot,
                        ),
                      );
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="relative min-h-0 flex-1 overflow-auto p-4">
          <div
            ref={stageRef}
            className="relative mx-auto aspect-square w-full max-w-[min(100%,calc(100vh-9rem))] overflow-hidden rounded-xl border-2 border-tm-green-300/30 bg-black"
            onClick={(event) => {
              if (event.target === event.currentTarget) return;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Town map for calibration"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
              draggable={false}
            />

            <button
              type="button"
              aria-label="Click map to center selected hotspot"
              className="absolute inset-0 z-0 cursor-crosshair"
              onClick={(event) => {
                if (!selectedId) return;
                const { x, y } = clientToPercent(event.clientX, event.clientY);
                setSpots((prev) =>
                  prev.map((spot) => {
                    if (spot.id !== selectedId) return spot;
                    return {
                      ...spot,
                      x: clamp(x - spot.w / 2, 0, 100 - spot.w),
                      y: clamp(y - spot.h / 2, 0, 100 - spot.h),
                    };
                  }),
                );
              }}
            />

            {spots.map((spot) => {
              const active = spot.id === selectedId;
              return (
                <div
                  key={spot.id}
                  role="button"
                  tabIndex={0}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setSelectedId(spot.id);
                    dragRef.current = {
                      id: spot.id,
                      mode: "move",
                      startX: event.clientX,
                      startY: event.clientY,
                      orig: { ...spot },
                    };
                  }}
                  className={`absolute z-10 cursor-move border-2 ${
                    active
                      ? "border-tm-gold bg-tm-gold/25"
                      : "border-fuchsia-400 bg-fuchsia-400/20"
                  }`}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: `${spot.w}%`,
                    height: `${spot.h}%`,
                  }}
                >
                  <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold">
                    {spot.label}
                  </span>
                  <div
                    className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize bg-tm-gold"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSelectedId(spot.id);
                      dragRef.current = {
                        id: spot.id,
                        mode: "resize",
                        startX: event.clientX,
                        startY: event.clientY,
                        orig: { ...spot },
                      };
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
