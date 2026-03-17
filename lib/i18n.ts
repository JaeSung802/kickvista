export type Locale = "ko" | "en";
export const SUPPORTED_LOCALES: Locale[] = ["ko", "en"];
export const DEFAULT_LOCALE: Locale = "ko";

export type Dictionary = typeof import("../messages/ko.json");

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ko: () => import("../messages/ko.json").then((m) => m.default as Dictionary),
  en: () => import("../messages/en.json").then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const loader = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  return loader();
}

export function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale);
}
