import de from "../../locales/de.json";
import en from "../../locales/en.json";
import es from "../../locales/es.json";
import fr from "../../locales/fr.json";
import it from "../../locales/it.json";
import ptBR from "../../locales/pt-BR.json";
import type { SupportedLocale } from "./resolve-locale";

export type Messages = typeof en;

export const MESSAGES: Record<SupportedLocale, Messages> = {
  en,
  fr,
  de,
  it,
  es,
  "pt-BR": ptBR,
};
