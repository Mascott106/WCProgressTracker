/** Labels used in fixtures.json before teams are known. */
const UNDETERMINED_PATTERNS = [
  /^Group [A-L] Winners?$/i,
  /^Group [A-L] Runners Up$/i,
  /^Match \d+ Winner$/i,
  /^Match \d+ Loser$/i,
  /^Best 3rd\b/i,
];

export function isUndeterminedTeamName(name: string | null | undefined): boolean {
  if (!name) return true;
  return UNDETERMINED_PATTERNS.some((re) => re.test(name.trim()));
}

/** Prefer API name when our schedule still has a placeholder. */
export function resolveTeamName(
  staticName: string,
  apiName: string | null | undefined,
): string {
  if (isUndeterminedTeamName(staticName) && apiName) {
    return apiName;
  }
  return staticName;
}
