import { getMessage } from "./get-message";
import type { SupportedLocale } from "./resolve-locale";

/** Translate match status codes for badges. */
export function translateStatus(
  status: string,
  locale: SupportedLocale,
): string {
  const key = `status.${status}`;
  const translated = getMessage(locale, key);
  if (translated !== key) {
    return translated;
  }
  return status;
}
