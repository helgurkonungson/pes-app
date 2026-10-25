/**
 * AI services with a free tier that the app can connect with minimal steps (ADR-023).
 * Gemini gets a key created automatically (ADR-021); the others open their key page inside
 * the app and pick the copied key from the clipboard. Terms checked 2026-10-25.
 */
import type { ProviderId } from "../core/types";

export interface FreeProvider {
  id: ProviderId;
  /** Minimum age in the provider's terms. 13 = with a parent's permission under 18. */
  minAge: 13 | 18;
  keyUrl: string;
  termsUrl: string;
  /** The provider may use what is sent on the free tier to train its models. */
  trainsOnFree: boolean;
  /** Finds this provider's key in copied text. */
  keyIn: (text: string) => string | null;
}

export const FREE_PROVIDERS: FreeProvider[] = [
  {
    id: "gemini",
    minAge: 18,
    keyUrl: "https://aistudio.google.com/app/apikey",
    termsUrl: "https://ai.google.dev/gemini-api/terms",
    trainsOnFree: true,
    keyIn: (t) => t.match(/AIza[0-9A-Za-z_-]{35}/)?.[0] ?? null,
  },
  {
    id: "groq",
    minAge: 18,
    keyUrl: "https://console.groq.com/keys",
    termsUrl: "https://console.groq.com/docs/legal/services-agreement",
    trainsOnFree: false,
    keyIn: (t) => t.match(/gsk_[A-Za-z0-9]{40,}/)?.[0] ?? null,
  },
  {
    id: "mistral",
    minAge: 13,
    keyUrl: "https://console.mistral.ai/api-keys",
    termsUrl: "https://legal.mistral.ai/terms",
    trainsOnFree: true,
    // Mistral keys have no prefix: accept only a lone 32-character token
    keyIn: (t) => (/^[A-Za-z0-9]{32}$/.test(t.trim()) ? t.trim() : null),
  },
  {
    id: "openrouter",
    minAge: 18,
    keyUrl: "https://openrouter.ai/settings/keys",
    termsUrl: "https://openrouter.ai/terms",
    trainsOnFree: true,
    keyIn: (t) => t.match(/sk-or-v1-[a-f0-9]{64}/)?.[0] ?? null,
  },
];

export const freeProvider = (id: ProviderId) => FREE_PROVIDERS.find((p) => p.id === id);

/** Bump when a consent text changes. */
export const FREE_CONSENT_VERSION = 1;
