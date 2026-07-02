import type { Messages } from "./messages";
import { localeToIntlTag, type SupportedLocale } from "./resolve-locale";
import { MESSAGES } from "./messages";

export interface GetMessageOptions {
  nerd?: boolean;
  count?: number;
  vars?: Record<string, string | number>;
}

type MessageNode = string | { normal: string; nerd: string } | Record<string, unknown>;

function isNerdPair(value: unknown): value is { normal: string; nerd: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "normal" in value &&
    "nerd" in value &&
    typeof (value as { normal: unknown }).normal === "string" &&
    typeof (value as { nerd: unknown }).nerd === "string"
  );
}

function isPluralForms(
  value: unknown,
): value is Record<string, string> {
  return typeof value === "object" && value !== null && "other" in value;
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

function getNestedValue(root: Messages, path: string): MessageNode | undefined {
  let current: unknown = root;
  for (const segment of path.split(".")) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current as MessageNode;
}

function pickPlural(
  forms: Record<string, string>,
  count: number,
  locale: SupportedLocale,
): string {
  const rules = new Intl.PluralRules(localeToIntlTag(locale));
  const category = rules.select(count);
  return (
    forms[category] ??
    forms.other ??
    forms.one ??
    Object.values(forms)[0] ??
    ""
  );
}

export function getMessage(
  locale: SupportedLocale,
  path: string,
  options: GetMessageOptions = {},
): string {
  const primary = getNestedValue(MESSAGES[locale], path);
  const fallback =
    locale === "en" ? undefined : getNestedValue(MESSAGES.en, path);
  const value = primary ?? fallback;

  if (value === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] missing key: ${path} (${locale})`);
    }
    return path;
  }

  if (typeof value === "string") {
    return interpolate(value, options.vars ?? {});
  }

  if (isNerdPair(value)) {
    const text = options.nerd ? value.nerd : value.normal;
    return interpolate(text, options.vars ?? {});
  }

  if (isPluralForms(value) && options.count !== undefined) {
    const text = pickPlural(value, options.count, locale);
    return interpolate(text, { count: options.count, ...options.vars });
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] unsupported message shape: ${path}`);
  }
  return path;
}
