/** Whether lessons can use AI right now. Pure — the UI and the session service share it. */
import type { AiBlock, Profile } from "./types";

export type AiState = "ok" | "off" | AiBlock;

/** After this long a "credits ran out" block is retried automatically (the learner may have topped up). */
export const CREDITS_RETRY_MS = 6 * 60 * 60 * 1000;

export function aiState(p: Pick<Profile, "aiMode" | "aiBlock"> | undefined, hasKey: boolean, now: number = Date.now()): AiState {
  if (p?.aiMode === "offline") return "off";
  if (!hasKey) return "no-key";
  const b = p?.aiBlock;
  if (b?.kind === "auth") return "auth";
  if (b?.kind === "credits" && now - Date.parse(b.at) < CREDITS_RETRY_MS) return "credits";
  return "ok";
}

export type AiErrorKind = "no-key" | "auth" | "credits" | "rate" | "overloaded" | "network" | "bad-response" | "api" | "aborted";

/** Maps an HTTP status + API error message to an error kind. */
export function classifyApiError(status: number, message: string): AiErrorKind {
  const m = message.toLowerCase();
  if (status === 402 || /credit balance|purchase credits|billing|insufficient[ _](credit|funds|quota|balance)|quota exceeded|exceeded your current quota|arrearage|good standing|not enough (money|funds)|payment required/.test(m)) return "credits";
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate";
  if (status === 529 || status >= 500) return "overloaded";
  return "api";
}

/** Kinds that won't go away by retrying — the app switches to offline lessons for them. */
export function isBlocking(kind: AiErrorKind): kind is AiBlock {
  return kind === "no-key" || kind === "auth" || kind === "credits";
}
