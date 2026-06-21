/** Normalize team names for matching API-Football responses to our schedule. */
const ALIASES: Record<string, string> = {
  "south korea": "korea republic",
  "korea republic": "korea republic",
  "korea rep": "korea republic",
  iran: "ir iran",
  "ir iran": "ir iran",
  "ivory coast": "cote divoire",
  "cote divoire": "cote divoire",
  "côte d'ivoire": "cote divoire",
  usa: "united states",
  "united states": "united states",
  usmnt: "united states",
  czechia: "czech republic",
  "czech republic": "czech republic",
  turkey: "turkiye",
  turkiye: "turkiye",
  "congo dr": "dr congo",
  "dr congo": "dr congo",
  "democratic republic of the congo": "dr congo",
  "cape verde": "cabo verde",
  "cape verde islands": "cabo verde",
  "cabo verde": "cabo verde",
  "bosnia and herzegovina": "bosnia herzegovina",
  "bosnia-herzegovina": "bosnia herzegovina",
  curacao: "curacao",
  "curaçao": "curacao",
  "south africa": "south africa",
  paraguay: "paraguay",
  qatar: "qatar",
  switzerland: "switzerland",
};

export function normalizeTeamName(name: string | null | undefined): string {
  if (!name) return "";
  const key = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return ALIASES[key] ?? key;
}

export function teamsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return normalizeTeamName(a) === normalizeTeamName(b);
}
