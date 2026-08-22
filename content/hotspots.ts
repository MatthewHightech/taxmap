export type Hotspot = {
  id: string;
  label: string;
  /** Percent of map width/height (0–100). Calibrate against town.png. */
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Placeholder hotspot boxes — tune with ?debugHotspots=1 on the play page.
 * Coordinates are % of the 4096×4096 town map.
 */
export const HOTSPOTS: Hotspot[] = [
  { id: "grocery", label: "Grocery", x: 22, y: 38, w: 10, h: 12 },
  { id: "bank", label: "Bank", x: 44, y: 24, w: 10, h: 12 },
  { id: "university", label: "University", x: 74, y: 40, w: 12, h: 14 },
  { id: "taxOffice", label: "Tax Office", x: 58, y: 36, w: 12, h: 12 },
  { id: "home", label: "Home", x: 36, y: 58, w: 10, h: 12 },
  { id: "car", label: "Car", x: 34, y: 68, w: 8, h: 8 },
];
