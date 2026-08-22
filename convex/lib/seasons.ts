export type Season = "may" | "september" | "january" | "april";

export const SEASON_ORDER: Season[] = [
  "may",
  "september",
  "january",
  "april",
];

export const SEASON_LABELS: Record<Season, string> = {
  may: "May · Summer",
  september: "September · Back to School",
  january: "January · Mid-Year",
  april: "April · Tax Day",
};

/** Locations unlocked at the start of each season. */
export const SEASON_LOCATIONS: Record<Season, string[]> = {
  may: ["home", "grocery", "car"],
  september: ["university", "bank", "grocery"],
  january: ["bank", "home", "car", "grocery"],
  april: ["taxOffice", "home"],
};

/** How many scenarios must be completed before auto-advancing (April has 0). */
export const SEASON_REQUIRED_SCENARIOS: Record<Season, number> = {
  may: 2,
  september: 3,
  january: 3,
  april: 0,
};

export function nextSeason(season: Season): Season | null {
  const index = SEASON_ORDER.indexOf(season);
  if (index < 0 || index >= SEASON_ORDER.length - 1) {
    return null;
  }
  return SEASON_ORDER[index + 1] ?? null;
}
