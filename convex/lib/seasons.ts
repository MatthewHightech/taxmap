export type Season = "may" | "september" | "january" | "april";

export const SEASON_ORDER: Season[] = [
  "may",
  "september",
  "january",
  "april",
];

export const SEASON_LABELS: Record<Season, string> = {
  may: "Summer",
  september: "Fall",
  january: "Winter",
  april: "Spring · Tax Day",
};

/**
 * Locations unlocked at the start of each season.
 * Bank and Food Bank are always available (optional; never block progress).
 */
export const SEASON_LOCATIONS: Record<Season, string[]> = {
  may: ["home", "bank", "foodBank"],
  september: ["university", "bank", "foodBank"],
  january: ["home", "university", "bank", "foodBank"],
  april: ["taxOffice", "bank", "foodBank"],
};

/** Required story scenarios per season (bank / food bank never count). */
export const SEASON_REQUIRED_SCENARIOS: Record<Season, number> = {
  may: 1,
  september: 1,
  january: 2,
  april: 0,
};

/** Quarterly slice of the $12k student salary (gross). */
export const QUARTERLY_GROSS_PAY = 3000;
/** Simplified federal-ish withhold on quarterly pay. */
export const QUARTERLY_WITHHOLDING = 450;
/** Net cash deposited each quarter. */
export const QUARTERLY_NET_PAY = QUARTERLY_GROSS_PAY - QUARTERLY_WITHHOLDING;

export function nextSeason(season: Season): Season | null {
  const index = SEASON_ORDER.indexOf(season);
  if (index < 0 || index >= SEASON_ORDER.length - 1) {
    return null;
  }
  return SEASON_ORDER[index + 1] ?? null;
}

export function seasonPrefix(season: Season): string {
  switch (season) {
    case "may":
      return "may-";
    case "september":
      return "sept-";
    case "january":
      return "jan-";
    case "april":
      return "april-";
  }
}

/** True when every required scenario for this season is done. */
export function seasonActivitiesComplete(
  season: Season,
  completedScenarioIds: string[],
): boolean {
  const required = SEASON_REQUIRED_SCENARIOS[season];
  if (required === 0) {
    return true;
  }
  const completedThisSeason = completedScenarioIds.filter((id) =>
    id.startsWith(seasonPrefix(season)),
  ).length;
  return completedThisSeason >= required;
}
