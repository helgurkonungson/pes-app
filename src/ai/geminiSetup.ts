/**
 * Creates a free Gemini API key in the learner's own Google account (ADR-021):
 * after an explicit consent and a Google sign-in (scope cloud-platform, used once),
 * the app finds or creates a "Chompbook" project, enables the Gemini API there,
 * creates a key restricted to that API and reads it. The access token is never
 * stored; the key goes to secure storage like a pasted one.
 */
import { AiError } from "./client";

export const CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
export const GEMINI_SERVICE = "generativelanguage.googleapis.com";
const LABEL = "chompbook";
/** Pages where the learner can do the same by hand. */
export const AI_STUDIO_KEYS = "https://aistudio.google.com/app/apikey";
export const GEMINI_TERMS = "https://ai.google.dev/gemini-api/terms";
/** Bump when the consent text changes, so it is asked again. */
export const CONSENT_VERSION = 1;

export type SetupStep = "project" | "api" | "key" | "check";
export type SetupFailure = "terms" | "denied" | "quota" | "config" | "region" | "network" | "unknown";

/** Google's answer from a country where the Gemini API isn't offered (Russia, Belarus, China…). */
const REGION = /location is not supported|not (?:available|supported) in your (?:country|region)|unsupported_country|FAILED_PRECONDITION.*location/i;

/** True when an error (a setup call or a key check) means "Gemini doesn't work from here". */
export function isRegionBlocked(e: unknown): boolean {
  if (e instanceof GeminiSetupError) return e.reason === "region";
  if (e instanceof AiError) return REGION.test(`${e.message} ${e.detail ?? ""}`);
  return e instanceof Error && REGION.test(e.message);
}

export class GeminiSetupError extends Error {
  constructor(
    message: string,
    readonly reason: SetupFailure,
  ) {
    super(message);
  }
}

export type Http = (url: string, opts: { method: "GET" | "POST"; headers: Record<string, string>; body?: unknown; timeoutMs?: number }) => Promise<{ status: number; data: unknown }>;

interface Operation {
  name?: string;
  done?: boolean;
  error?: { code?: number; message?: string };
  response?: Record<string, unknown>;
}

export interface SetupDeps {
  http: Http;
  sleep?: (ms: number) => Promise<void>;
  onStep?: (s: SetupStep) => void;
  /** Validates the key (lists models); new keys can take a little while to work. */
  testKey: (key: string) => Promise<unknown>;
  /** Random suffix for a new project id. */
  random?: () => string;
}

/** Google's error → why setup failed, in terms the learner can act on. */
export function classifySetupError(status: number, data: unknown): GeminiSetupError {
  const err = (data as { error?: { message?: string; status?: string; details?: { reason?: string }[] } } | null)?.error;
  const msg = err?.message ?? `HTTP ${status}`;
  const reasons = (err?.details ?? []).map((d) => d.reason ?? "").join(" ");
  const text = `${msg} ${err?.status ?? ""} ${reasons}`;
  if (REGION.test(text)) return new GeminiSetupError(msg, "region");
  if (/terms of service|tos|accept.*terms/i.test(text)) return new GeminiSetupError(msg, "terms");
  if (/SERVICE_DISABLED|has not been used in project|API .* is disabled|accessNotConfigured/i.test(text)) return new GeminiSetupError(msg, "config");
  if (/quota|limit|too many projects/i.test(text) || status === 429) return new GeminiSetupError(msg, "quota");
  if (status === 401 || status === 403) return new GeminiSetupError(msg, "denied");
  return new GeminiSetupError(msg, "unknown");
}

export async function createGeminiKey(accessToken: string, deps: SetupDeps): Promise<{ key: string; projectId: string }> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const h = { authorization: `Bearer ${accessToken}`, "content-type": "application/json" };
  const call = async <T>(method: "GET" | "POST", url: string, body?: unknown): Promise<T> => {
    let r: { status: number; data: unknown };
    try {
      r = await deps.http(url, { method, headers: h, body, timeoutMs: 60_000 });
    } catch (e) {
      throw new GeminiSetupError(e instanceof Error ? e.message : String(e), "network");
    }
    if (r.status < 200 || r.status >= 300) throw classifySetupError(r.status, r.data);
    return r.data as T;
  };
  const wait = async (op: Operation, base: string): Promise<Operation> => {
    for (let i = 0; !op.done && op.name && i < 40; i++) {
      await sleep(i < 5 ? 1500 : 3000);
      op = await call<Operation>("GET", `${base}/${op.name}`);
    }
    if (op.error) throw classifySetupError(op.error.code === 7 ? 403 : 400, { error: op.error });
    if (!op.done && op.name) throw new GeminiSetupError("Google is taking too long.", "network");
    return op;
  };

  // 1. a project made by Chompbook earlier, or a new one
  deps.onStep?.("project");
  const CRM = "https://cloudresourcemanager.googleapis.com/v1";
  const found = await call<{ projects?: { projectId: string; lifecycleState?: string }[] }>("GET", `${CRM}/projects?filter=${encodeURIComponent(`labels.created-by:${LABEL} lifecycleState:ACTIVE`)}`);
  let projectId = found.projects?.find((p) => !p.lifecycleState || p.lifecycleState === "ACTIVE")?.projectId;
  if (!projectId) {
    const suffix = (deps.random ?? (() => Math.random().toString(36).slice(2, 8)))().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "app";
    projectId = `chompbook-${suffix}`;
    const op = await call<Operation>("POST", `${CRM}/projects`, { projectId, name: "Chompbook", labels: { "created-by": LABEL } });
    await wait(op, CRM);
  }

  // 2. the Gemini API in that project
  deps.onStep?.("api");
  const SU = "https://serviceusage.googleapis.com/v1";
  const enable = await call<Operation>("POST", `${SU}/projects/${projectId}/services/${GEMINI_SERVICE}:enable`, {});
  await wait(enable, SU);

  // 3. a key restricted to the Gemini API (reuse ours if it exists)
  deps.onStep?.("key");
  const AK = "https://apikeys.googleapis.com/v2";
  const keys = await call<{ keys?: { name: string; displayName?: string }[] }>("GET", `${AK}/projects/${projectId}/locations/global/keys`);
  let keyName = keys.keys?.find((k) => k.displayName === "Chompbook")?.name;
  if (!keyName) {
    const op = await wait(
      await call<Operation>("POST", `${AK}/projects/${projectId}/locations/global/keys`, { displayName: "Chompbook", restrictions: { apiTargets: [{ service: GEMINI_SERVICE }] } }),
      AK,
    );
    keyName = (op.response as { name?: string } | undefined)?.name;
    if (!keyName) throw new GeminiSetupError("Google created no key.", "unknown");
  }
  const { keyString } = await call<{ keyString?: string }>("GET", `${AK}/${keyName}/keyString`);
  if (!keyString) throw new GeminiSetupError("Google returned an empty key.", "unknown");

  // 4. a new key may need a minute before Gemini accepts it
  deps.onStep?.("check");
  let last: unknown;
  for (let i = 0; i < 12; i++) {
    try {
      await deps.testKey(keyString);
      return { key: keyString, projectId };
    } catch (e) {
      last = e;
      // waiting won't help: no internet, no credits, or Gemini isn't offered in this country
      if (isRegionBlocked(e)) throw new GeminiSetupError(e instanceof Error ? e.message : String(e), "region");
      if (e instanceof AiError && (e.kind === "network" || e.kind === "credits")) break;
      await sleep(5000);
    }
  }
  throw last instanceof AiError ? last : new GeminiSetupError("The new key doesn't work yet.", "unknown");
}

/** A Gemini key copied to the clipboard ("AIza…", 39 characters), or null. */
export function geminiKeyIn(text: string | null | undefined): string | null {
  return text?.match(/AIza[0-9A-Za-z_-]{35}/)?.[0] ?? null;
}
