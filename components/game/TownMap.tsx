"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HOTSPOTS } from "../../content/hotspots";
import { TOWN_IMAGE_SRC } from "../../content/mapAssets";
import { PlayerSprite } from "./PlayerSprite";

type TownMapProps = {
  unlockedLocationIds: string[];
  /** Locations that still have an activity this season. */
  activeLocationIds: string[];
  onSelectLocation: (locationId: string) => void;
  debugHotspots?: boolean;
};

/** How much larger the world is than the viewport (higher = more zoomed in). */
const WORLD_ZOOM = 2.00;
/** Movement speed as fraction of world size per second. */
const MOVE_SPEED = 0.22;
/** Walk animation frames per second while moving. */
const WALK_FPS = 10;
/** Start near Home on the map (%). */
const START_X = 0.41;
const START_Y = 0.64;
/** Interact when player center is within this fraction of hotspot half-size. */
const INTERACT_PADDING = 1.35;

type Keys = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function TownMap({
  unlockedLocationIds,
  activeLocationIds,
  onSelectLocation,
  debugHotspots = false,
}: TownMapProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Keys>({ w: false, a: false, s: false, d: false });
  const playerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const facingRef = useRef<"left" | "right">("right");
  const animAccumRef = useRef(0);
  const worldSizeRef = useRef(0);
  const viewSizeRef = useRef({ w: 0, h: 0 });
  const activeRef = useRef(new Set<string>());
  const nearbyRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelectLocation);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const [view, setView] = useState({
    worldSize: 0,
    viewW: 0,
    viewH: 0,
    playerX: 0,
    playerY: 0,
    cameraX: 0,
    cameraY: 0,
    frame: 0,
    facing: "right" as "left" | "right",
    nearbyId: null as string | null,
  });

  const unlocked = useMemo(
    () => new Set(unlockedLocationIds),
    [unlockedLocationIds],
  );
  const active = useMemo(
    () => new Set(activeLocationIds),
    [activeLocationIds],
  );

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    onSelectRef.current = onSelectLocation;
  }, [onSelectLocation]);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewW = rect.width;
    const viewH = rect.height;
    if (viewW < 8 || viewH < 8) return;

    const worldSize = Math.max(viewW, viewH) * WORLD_ZOOM;
    const wasZero = worldSizeRef.current === 0;
    worldSizeRef.current = worldSize;
    viewSizeRef.current = { w: viewW, h: viewH };

    if (wasZero) {
      playerRef.current = {
        x: worldSize * START_X,
        y: worldSize * START_Y,
      };
    } else {
      const margin = worldSize * 0.04;
      playerRef.current.x = clamp(
        playerRef.current.x,
        margin,
        worldSize - margin,
      );
      playerRef.current.y = clamp(
        playerRef.current.y,
        margin,
        worldSize - margin,
      );
    }

    const cameraX = clamp(
      playerRef.current.x - viewW / 2,
      0,
      Math.max(0, worldSize - viewW),
    );
    const cameraY = clamp(
      playerRef.current.y - viewH / 2,
      0,
      Math.max(0, worldSize - viewH),
    );

    setView((prev) => ({
      ...prev,
      worldSize,
      viewW,
      viewH,
      playerX: playerRef.current.x,
      playerY: playerRef.current.y,
      cameraX,
      cameraY,
    }));
  }, []);

  useEffect(() => {
    measure();
    const el = viewportRef.current;
    const ro = new ResizeObserver(() => measure());
    if (el) ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    const findNearby = (px: number, py: number, worldSize: number) => {
      for (const spot of HOTSPOTS) {
        if (!activeRef.current.has(spot.id)) continue;
        const cx = ((spot.x + spot.w / 2) / 100) * worldSize;
        const cy = ((spot.y + spot.h / 2) / 100) * worldSize;
        const rx = ((spot.w / 100) * worldSize * INTERACT_PADDING) / 2;
        const ry = ((spot.h / 100) * worldSize * INTERACT_PADDING) / 2;
        if (Math.abs(px - cx) <= rx && Math.abs(py - cy) <= ry) {
          return spot.id;
        }
      }
      return null;
    };

    const loop = (ts: number) => {
      const worldSize = worldSizeRef.current;
      const { w: viewW, h: viewH } = viewSizeRef.current;
      if (worldSize > 0 && viewW > 0) {
        const last = lastTsRef.current ?? ts;
        const dt = Math.min(0.05, (ts - last) / 1000);
        lastTsRef.current = ts;

        const keys = keysRef.current;
        let dx = 0;
        let dy = 0;
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;

        const moving = dx !== 0 || dy !== 0;
        if (moving) {
          const len = Math.hypot(dx, dy) || 1;
          const speed = worldSize * MOVE_SPEED;
          const margin = worldSize * 0.035;
          playerRef.current.x = clamp(
            playerRef.current.x + (dx / len) * speed * dt,
            margin,
            worldSize - margin,
          );
          playerRef.current.y = clamp(
            playerRef.current.y + (dy / len) * speed * dt,
            margin,
            worldSize - margin,
          );

          if (dx < 0) facingRef.current = "left";
          if (dx > 0) facingRef.current = "right";

          animAccumRef.current += dt;
          const frameDur = 1 / WALK_FPS;
          while (animAccumRef.current >= frameDur) {
            animAccumRef.current -= frameDur;
            frameRef.current = (frameRef.current + 1) % 8;
          }
        } else {
          frameRef.current = 0;
          animAccumRef.current = 0;
        }

        const cameraX = clamp(
          playerRef.current.x - viewW / 2,
          0,
          Math.max(0, worldSize - viewW),
        );
        const cameraY = clamp(
          playerRef.current.y - viewH / 2,
          0,
          Math.max(0, worldSize - viewH),
        );

        const nearbyId = findNearby(
          playerRef.current.x,
          playerRef.current.y,
          worldSize,
        );
        nearbyRef.current = nearbyId;

        setView({
          worldSize,
          viewW,
          viewH,
          playerX: playerRef.current.x,
          playerY: playerRef.current.y,
          cameraX,
          cameraY,
          frame: frameRef.current,
          facing: facingRef.current,
          nearbyId,
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    };

    const setKey = (code: string, down: boolean) => {
      switch (code) {
        case "KeyW":
        case "ArrowUp":
          keysRef.current.w = down;
          break;
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.a = down;
          break;
        case "KeyS":
        case "ArrowDown":
          keysRef.current.s = down;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.d = down;
          break;
        default:
          break;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (
        event.code === "KeyW" ||
        event.code === "KeyA" ||
        event.code === "KeyS" ||
        event.code === "KeyD" ||
        event.code.startsWith("Arrow")
      ) {
        event.preventDefault();
        setKey(event.code, true);
      }
      if (event.code === "KeyE" && nearbyRef.current) {
        event.preventDefault();
        onSelectRef.current(nearbyRef.current);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      setKey(event.code, false);
    };

    const onBlur = () => {
      keysRef.current = { w: false, a: false, s: false, d: false };
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const spriteSize = view.worldSize > 0 ? view.worldSize * 0.085 : 96;
  const nearbySpot = HOTSPOTS.find((spot) => spot.id === view.nearbyId);

  return (
    <div
      ref={viewportRef}
      className="relative h-full min-h-[420px] w-full flex-1 overflow-hidden bg-tm-green-900 outline-none"
      tabIndex={0}
      role="application"
      aria-label="Town map. Use W A S D to walk. Press E near a building to enter."
      onMouseDown={() => viewportRef.current?.focus()}
    >
      {view.worldSize > 0 ? (
        <div
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: view.worldSize,
            height: view.worldSize,
            transform: `translate3d(${-view.cameraX}px, ${-view.cameraY}px, 0)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TOWN_IMAGE_SRC}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          />

          {HOTSPOTS.map((spot) => {
            const isUnlocked = unlocked.has(spot.id);
            const isActive = active.has(spot.id);
            const isNearby = view.nearbyId === spot.id;
            return (
              <button
                key={spot.id}
                type="button"
                disabled={!isActive}
                onClick={() => onSelectLocation(spot.id)}
                title={
                  isActive
                    ? spot.label
                    : isUnlocked
                      ? `${spot.label} (done)`
                      : spot.label
                }
                className={`absolute rounded-lg border-2 transition ${
                  debugHotspots
                    ? "border-fuchsia-400 bg-fuchsia-400/30"
                    : isNearby
                      ? "border-tm-gold bg-tm-gold/25"
                      : "border-transparent"
                } ${
                  isActive
                    ? "cursor-pointer hover:border-tm-gold/80 hover:bg-tm-gold/15"
                    : "cursor-not-allowed opacity-70"
                }`}
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${spot.w}%`,
                  height: `${spot.h}%`,
                }}
              >
                <span className="sr-only">{spot.label}</span>
                {isActive ? (
                  <span
                    className={`pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-[110%] whitespace-nowrap rounded-xl border-[3px] px-3 py-1.5 font-[family-name:var(--font-game)] text-sm font-extrabold shadow-[0_8px_20px_rgba(0,0,0,0.55)] md:text-base ${
                      isNearby
                        ? "border-[#06281d] bg-tm-gold text-tm-ink"
                        : "border-tm-gold bg-[#06281d] text-white"
                    }`}
                  >
                    {spot.label}
                  </span>
                ) : (
                  <span className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[110%] whitespace-nowrap rounded-xl border-2 border-white/30 bg-black/55 px-2.5 py-1 font-[family-name:var(--font-game)] text-xs font-bold text-white/80 shadow-md">
                    {isUnlocked ? `${spot.label} · Done` : spot.label}
                  </span>
                )}
              </button>
            );
          })}

          <PlayerSprite
            x={view.playerX}
            y={view.playerY}
            frame={view.frame}
            facing={view.facing}
            size={spriteSize}
          />
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-4 left-4 z-30 rounded-full border-2 border-tm-green-300/70 bg-black/75 px-4 py-2 font-[family-name:var(--font-game)] text-xs font-bold text-tm-cream shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <span className="text-tm-gold">WASD</span> walk
        {" · "}
        <span className="text-tm-gold">E</span> select
        {nearbySpot ? (
          <span className="text-tm-cream/80"> · {nearbySpot.label}</span>
        ) : null}
      </div>
    </div>
  );
}
