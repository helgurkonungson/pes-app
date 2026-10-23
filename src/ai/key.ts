/**
 * The user's own API keys (BYOK), one per provider. On the phone they live in
 * the Android Keystore / iOS Keychain via the secure-storage plugin; in a
 * desktop browser (dev only) the plugin falls back to localStorage.
 */
import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import type { ProviderId } from "../core/types";
import { getProfile } from "../data/db";
import { activeProvider } from "./providers";

// "anthropic_api_key" is the v0.1 name — kept so existing keys keep working
const storageKey = (p: ProviderId) => `${p}_api_key`;
const cache = new Map<ProviderId, string | null>();

async function resolve(provider?: ProviderId): Promise<ProviderId> {
  return provider ?? activeProvider(await getProfile());
}

export async function getApiKey(provider?: ProviderId): Promise<string | null> {
  const p = await resolve(provider);
  if (cache.has(p)) return cache.get(p)!;
  let v: string | null = null;
  try {
    const raw = await SecureStorage.getItem(storageKey(p));
    v = raw && raw.trim() ? raw.trim() : null;
  } catch {
    v = null;
  }
  cache.set(p, v);
  return v;
}

export async function setApiKey(value: string, provider?: ProviderId): Promise<void> {
  const p = await resolve(provider);
  const v = value.trim();
  await SecureStorage.setItem(storageKey(p), v);
  cache.set(p, v || null);
}

export async function clearApiKey(provider?: ProviderId): Promise<void> {
  const p = await resolve(provider);
  try {
    await SecureStorage.removeItem(storageKey(p));
  } finally {
    cache.set(p, null);
  }
}

export function maskKey(key: string | null): string {
  if (!key) return "—";
  return key.length > 12 ? `${key.slice(0, 6)}…${key.slice(-4)}` : "••••";
}
