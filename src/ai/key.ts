/**
 * The user's own API key (BYOK). On the phone it lives in the Android Keystore /
 * iOS Keychain via the secure-storage plugin; in a desktop browser (dev only)
 * the plugin falls back to localStorage.
 */
import { SecureStorage } from "@aparajita/capacitor-secure-storage";

const KEY = "anthropic_api_key";
let cache: string | null | undefined;

export async function getApiKey(): Promise<string | null> {
  if (cache !== undefined) return cache;
  try {
    const v = await SecureStorage.getItem(KEY);
    cache = v && v.trim() ? v.trim() : null;
  } catch {
    cache = null;
  }
  return cache;
}

export async function setApiKey(value: string): Promise<void> {
  const v = value.trim();
  await SecureStorage.setItem(KEY, v);
  cache = v || null;
}

export async function clearApiKey(): Promise<void> {
  try {
    await SecureStorage.removeItem(KEY);
  } finally {
    cache = null;
  }
}

export function maskKey(key: string | null): string {
  if (!key) return "Not set";
  return key.length > 12 ? `${key.slice(0, 7)}…${key.slice(-4)}` : "••••";
}
