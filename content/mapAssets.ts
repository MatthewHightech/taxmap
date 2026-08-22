/** Active town map (same pixel size as source PNG; WebP for transfer size). */
export const TOWN_IMAGE_SRC = "/assets/town3.webp";

/** Player walk cycle sheet. */
export const PLAYER_SPRITE_SRC = "/assets/sprite_sheet2.webp";

/** Alternate maps in /public/assets — switch TOWN_IMAGE_SRC to match. */
export const TOWN_IMAGE_OPTIONS = [
  { src: "/assets/town.webp", label: "town.webp" },
  { src: "/assets/town2.webp", label: "town2.webp" },
  { src: "/assets/town3.webp", label: "town3.webp" },
] as const;
