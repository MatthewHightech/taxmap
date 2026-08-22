export type Hotspot = {
  id: string;
  label: string;
  /** Percent of map width/height (0–100). Calibrate against town map image. */
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Landmark hitboxes as % of the town map.
 * Re-tune via /calibrate → Copy config.
 */
export const HOTSPOTS: Hotspot[] = [
  { id: "foodBank", label: "Food Bank", x: 67.9, y: 49.7, w: 15.7, h: 9.7 },
  { id: "bank", label: "Bank", x: 43.2, y: 5.9, w: 11.5, h: 13 },
  { id: "university", label: "University", x: 19, y: 38.2, w: 17.4, h: 19.7 },
  { id: "taxOffice", label: "Tax Office", x: 65.2, y: 17.2, w: 17.1, h: 14.8 },
  { id: "home", label: "Home", x: 16.7, y: 68.9, w: 21.6, h: 16.4 },
];
