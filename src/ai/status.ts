/** Remembers persistent AI problems (no credits, rejected key) so the app can switch to offline lessons. */
import { useEffect, useState } from "react";
import { type AiState, aiState, isBlocking } from "../core/aiStatus";
import { nowIso } from "../core/ids";
import { getProfile, updateProfile } from "../data/db";
import { useProfile } from "../data/hooks";
import { AiError } from "./client";
import { logEvent } from "../data/logs";
import { providerReady } from "./key";

export async function reportAiError(e: unknown): Promise<void> {
  if (e instanceof AiError && e.kind !== "aborted") void logEvent("ai", `${e.provider ?? "ai"} ${e.kind}${e.status ? ` ${e.status}` : ""}: ${e.message}`, e.detail);
  if (e instanceof AiError && isBlocking(e.kind) && e.kind !== "no-key") {
    await updateProfile({ aiBlock: { kind: e.kind, at: nowIso() } });
  }
}

export async function reportAiOk(): Promise<void> {
  const p = await getProfile();
  if (p.aiBlock) await updateProfile({ aiBlock: undefined });
}

/** Live AI state for screens. `keyVersion` lets Settings force a refresh after the key changes. */
export function useAiState(keyVersion = 0): AiState | undefined {
  const profile = useProfile();
  const [hasKey, setHasKey] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    providerReady().then((ok) => alive && setHasKey(ok));
    return () => {
      alive = false;
    };
  }, [keyVersion, profile?.aiBlock?.at, profile?.provider, profile?.customBaseUrl, profile?.providerModels]);
  if (!profile || hasKey === undefined) return undefined;
  return aiState(profile, hasKey);
}
