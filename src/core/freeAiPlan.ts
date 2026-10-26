/**
 * Which free AI service the first-run "Connect a free AI" offers first (ADR-028).
 * OpenRouter connects in one tap (OAuth: sign in, the key comes back by itself) and works
 * from Russia; Gemini's key is created automatically too, but its API is unavailable in
 * some countries and its free tier is not allowed in the EEA, the UK and Switzerland.
 * The phone's time zone is the only signal used — nothing is sent anywhere. Pure, unit tested.
 */
import type { AgeGroup } from "./age";
import type { ProviderId } from "./types";

/** Time zones where the Gemini API isn't offered (Russia, Belarus, China, Hong Kong, Macau, Iran, North Korea, Syria, Cuba). */
const NO_GEMINI = new Set([
  "Europe/Moscow", "Europe/Kaliningrad", "Europe/Samara", "Europe/Volgograd", "Europe/Kirov", "Europe/Astrakhan", "Europe/Saratov", "Europe/Ulyanovsk", "Europe/Simferopol",
  "Asia/Yekaterinburg", "Asia/Omsk", "Asia/Novosibirsk", "Asia/Barnaul", "Asia/Tomsk", "Asia/Novokuznetsk", "Asia/Krasnoyarsk", "Asia/Irkutsk", "Asia/Chita",
  "Asia/Yakutsk", "Asia/Khandyga", "Asia/Vladivostok", "Asia/Ust-Nera", "Asia/Magadan", "Asia/Sakhalin", "Asia/Srednekolymsk", "Asia/Kamchatka", "Asia/Anadyr",
  "Europe/Minsk", "Asia/Shanghai", "Asia/Urumqi", "Asia/Chongqing", "Asia/Harbin", "Asia/Hong_Kong", "Asia/Macau", "Asia/Tehran", "Asia/Pyongyang", "Asia/Damascus", "America/Havana",
]);

/** EEA, UK and Switzerland: the Gemini API's free tier may not be used there. */
const NO_GEMINI_FREE = new Set([
  "Europe/Amsterdam", "Europe/Athens", "Europe/Berlin", "Europe/Bratislava", "Europe/Brussels", "Europe/Bucharest", "Europe/Budapest", "Europe/Copenhagen", "Europe/Dublin",
  "Europe/Helsinki", "Europe/Lisbon", "Atlantic/Azores", "Atlantic/Madeira", "Europe/Ljubljana", "Europe/Luxembourg", "Europe/Madrid", "Atlantic/Canary", "Africa/Ceuta",
  "Europe/Malta", "Europe/Paris", "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Sofia", "Europe/Stockholm", "Europe/Tallinn", "Europe/Vienna", "Europe/Vilnius",
  "Europe/Warsaw", "Europe/Zagreb", "Asia/Nicosia", "Asia/Famagusta", "Europe/Nicosia", "Atlantic/Reykjavik", "Europe/Vaduz", "Europe/Oslo", "Arctic/Longyearbyen",
  "Europe/London", "Europe/Belfast", "Europe/Guernsey", "Europe/Isle_of_Man", "Europe/Jersey", "Europe/Gibraltar", "Europe/Zurich", "Europe/Busingen",
]);

export type GeminiAvailability = "yes" | "no-api" | "no-free-tier";

export function geminiAvailability(timeZone: string | undefined): GeminiAvailability {
  if (!timeZone) return "yes";
  if (NO_GEMINI.has(timeZone)) return "no-api";
  if (NO_GEMINI_FREE.has(timeZone)) return "no-free-tier";
  return "yes";
}

export interface FreeAiPlan {
  /** Shown first, as big buttons (best first). */
  primary: ProviderId[];
  /** Behind "Other services". */
  others: ProviderId[];
}

/**
 * Adults: OpenRouter (one tap) first everywhere, then Gemini where its free tier works.
 * Teens: only services that allow 13–17 (Mistral). Children: nothing (lessons without AI).
 */
export function freeAiPlan(age: AgeGroup | undefined, timeZone: string | undefined): FreeAiPlan {
  if (age === "child" || !age) return { primary: [], others: [] };
  if (age === "teen") return { primary: ["mistral"], others: [] };
  const gemini = geminiAvailability(timeZone) === "yes";
  return {
    primary: gemini ? ["openrouter", "gemini"] : ["openrouter"],
    others: gemini ? ["groq", "mistral"] : ["gemini", "groq", "mistral"],
  };
}

export const phoneTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};
