import type { ProviderId } from "../core/types";
import { getProfile, updateProfile } from "../data/db";
import { testKey } from "./client";
import { FREE_CONSENT_VERSION } from "./freeProviders";
import { setApiKey } from "./key";
import { pickDefaultModel } from "./providers";

/** Saves a verified key, makes the provider active and records the consent. */
export async function adoptFreeKey(id: ProviderId, key: string): Promise<void> {
  const models = await testKey(key, id);
  await setApiKey(key, id);
  const p = await getProfile();
  const model = p.providerModels?.[id] || pickDefaultModel(id, models.map((m) => m.id));
  await updateProfile({
    provider: id,
    aiBlock: undefined,
    providerModels: { ...p.providerModels, ...(model ? { [id]: model } : {}) },
    aiConsents: { ...p.aiConsents, [id]: { version: FREE_CONSENT_VERSION, at: new Date().toISOString() } },
  });
}
