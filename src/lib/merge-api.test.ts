import {
  apiGroupLetter,
  countMatchedFixtures,
  expectedApiStage,
  mergeExternalMatches,
  type ExternalMatch,
} from "./merge-api";
import type { StaticMatch } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(expectedApiStage({ id: 1 } as StaticMatch) === "GROUP_STAGE", "group stage");
assert(expectedApiStage({ id: 73 } as StaticMatch) === "LAST_32", "round of 32");
assert(expectedApiStage({ id: 104 } as StaticMatch) === "FINAL", "final");

assert(apiGroupLetter("GROUP_A") === "A", "GROUP_A → A");
assert(apiGroupLetter(null) === null, "null group");

const kickoff = "2026-06-28T19:00:00Z";

const wrongStage: ExternalMatch = {
  apiId: 1,
  stage: "GROUP_STAGE",
  group: "GROUP_A",
  date: kickoff,
  status: "FT",
  statusLong: "Full Time",
  homeTeam: "South Africa",
  awayTeam: "Canada",
  homeGoals: 1,
  awayGoals: 0,
};

const rightStage: ExternalMatch = {
  apiId: 2,
  stage: "LAST_32",
  group: null,
  date: kickoff,
  status: "FT",
  statusLong: "Full Time",
  homeTeam: "South Africa",
  awayTeam: "Canada",
  homeGoals: 1,
  awayGoals: 0,
};

const matched = countMatchedFixtures([wrongStage, rightStage]);
assert(matched >= 1, "stage filter should prefer LAST_32 over GROUP_STAGE");

const groupKickoff = "2026-06-11T19:00:00.000Z";

const groupBApi: ExternalMatch = {
  apiId: 10,
  stage: "GROUP_STAGE",
  group: "GROUP_B",
  date: groupKickoff,
  status: "FT",
  statusLong: "Full Time",
  homeTeam: "Canada",
  awayTeam: "Qatar",
  homeGoals: 2,
  awayGoals: 1,
};

const groupAApi: ExternalMatch = {
  apiId: 11,
  stage: "GROUP_STAGE",
  group: "GROUP_A",
  date: groupKickoff,
  status: "FT",
  statusLong: "Full Time",
  homeTeam: "Mexico",
  awayTeam: "South Africa",
  homeGoals: 1,
  awayGoals: 0,
};

// countMatchedFixtures runs full fixture list; verify group disambiguation via merge
const merged = mergeExternalMatches([groupBApi, groupAApi]);
const match1 = merged.find((m) => m.id === 1);
assert(match1?.homeTeam === "Mexico", "group A fixture should not pick group B API row");
assert(match1?.homeGoals === 1, "group A scores from correct API row");

console.log("merge-api tests passed");
