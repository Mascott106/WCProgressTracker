export type SupportedLocale = "en" | "fr" | "de" | "it" | "es" | "pt-BR";

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  "en",
  "fr",
  "de",
  "it",
  "es",
  "pt-BR",
];

const LOCALE_ALIASES: Record<string, SupportedLocale> = {
  en: "en",
  fr: "fr",
  de: "de",
  it: "it",
  es: "es",
  pt: "pt-BR",
  "pt-br": "pt-BR",
};

/** Map BCP 47 tags to a supported locale; unknown → en. */
export function resolveLocale(tag: string): SupportedLocale {
  const normalized = tag.trim().toLowerCase().replace(/_/g, "-");
  if (normalized in LOCALE_ALIASES) {
    return LOCALE_ALIASES[normalized];
  }
  const base = normalized.split("-")[0];
  if (base in LOCALE_ALIASES) {
    return LOCALE_ALIASES[base];
  }
  return "en";
}

/** BCP 47 tag for Intl APIs. */
export function localeToIntlTag(locale: SupportedLocale): string {
  switch (locale) {
    case "pt-BR":
      return "pt-BR";
    case "en":
      return "en-US";
    case "fr":
      return "fr-FR";
    case "de":
      return "de-DE";
    case "it":
      return "it-IT";
    case "es":
      return "es-ES";
    default:
      return "en-US";
  }
}

/** Short code shown in the footer picker. */
export function localePickerCode(locale: SupportedLocale): string {
  return locale === "pt-BR" ? "PT" : locale.toUpperCase();
}
