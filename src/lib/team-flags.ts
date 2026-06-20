import { isUndeterminedTeamName } from "./placeholders";
import { normalizeTeamName } from "./team-names";

function flagFromIso(iso: string): string {
  const code = iso.toUpperCase();
  if (code.length !== 2) return "";
  return [...code]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

/** Subdivision flags for UK home nations (FIFA uses separate teams). */
const ENGLAND_FLAG = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
const SCOTLAND_FLAG = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";

/** Lookup by normalized team name (matches team-names.ts aliases). */
const FLAG_BY_TEAM: Record<string, string> = {
  mexico: flagFromIso("MX"),
  "south africa": flagFromIso("ZA"),
  "korea republic": flagFromIso("KR"),
  "czech republic": flagFromIso("CZ"),
  canada: flagFromIso("CA"),
  "bosnia herzegovina": flagFromIso("BA"),
  "united states": flagFromIso("US"),
  paraguay: flagFromIso("PY"),
  haiti: flagFromIso("HT"),
  scotland: SCOTLAND_FLAG,
  australia: flagFromIso("AU"),
  turkiye: flagFromIso("TR"),
  brazil: flagFromIso("BR"),
  morocco: flagFromIso("MA"),
  qatar: flagFromIso("QA"),
  switzerland: flagFromIso("CH"),
  "cote divoire": flagFromIso("CI"),
  ecuador: flagFromIso("EC"),
  germany: flagFromIso("DE"),
  curacao: flagFromIso("CW"),
  netherlands: flagFromIso("NL"),
  japan: flagFromIso("JP"),
  sweden: flagFromIso("SE"),
  tunisia: flagFromIso("TN"),
  "saudi arabia": flagFromIso("SA"),
  uruguay: flagFromIso("UY"),
  spain: flagFromIso("ES"),
  "cabo verde": flagFromIso("CV"),
  "ir iran": flagFromIso("IR"),
  "new zealand": flagFromIso("NZ"),
  belgium: flagFromIso("BE"),
  egypt: flagFromIso("EG"),
  france: flagFromIso("FR"),
  senegal: flagFromIso("SN"),
  iraq: flagFromIso("IQ"),
  norway: flagFromIso("NO"),
  argentina: flagFromIso("AR"),
  algeria: flagFromIso("DZ"),
  austria: flagFromIso("AT"),
  jordan: flagFromIso("JO"),
  ghana: flagFromIso("GH"),
  panama: flagFromIso("PA"),
  england: ENGLAND_FLAG,
  croatia: flagFromIso("HR"),
  portugal: flagFromIso("PT"),
  "dr congo": flagFromIso("CD"),
  uzbekistan: flagFromIso("UZ"),
  colombia: flagFromIso("CO"),
};

export function teamFlag(name: string | null | undefined): string {
  if (!name || isUndeterminedTeamName(name)) return "";
  return FLAG_BY_TEAM[normalizeTeamName(name)] ?? "";
}
