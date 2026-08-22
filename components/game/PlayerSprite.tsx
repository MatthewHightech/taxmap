"use client";

type PlayerSpriteProps = {
  /** World X in px (sprite center). */
  x: number;
  /** World Y in px (sprite feet). */
  y: number;
  frame: number;
  facing: "left" | "right";
  /** Rendered sprite height in world px. */
  size: number;
};

/** sprite_sheet.png is 2048×2048 with 4 columns × 2 rows (8 walk frames). */
const COLS = 4;
const ROWS = 2;
const FRAME_COUNT = COLS * ROWS;

export function PlayerSprite({ x, y, frame, facing, size }: PlayerSpriteProps) {
  const safeFrame = ((frame % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
  const col = safeFrame % COLS;
  const row = Math.floor(safeFrame / COLS);
  const width = size * 0.72;

  return (
    <div
      className="pointer-events-none absolute will-change-transform"
      style={{
        left: x,
        top: y,
        width,
        height: size,
        transform: `translate(-50%, -92%) scaleX(${facing === "left" ? -1 : 1})`,
        zIndex: 20,
      }}
      aria-hidden
    >
      <div
        className="h-full w-full"
        style={{
          backgroundImage: "url(/assets/sprite_sheet.png)",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
          backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
          imageRendering: "auto",
          filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.35))",
        }}
      />
    </div>
  );
}
