/**
 * How AI problems and providers are put into words on screens (ADR-036): shared by the lesson,
 * Settings and onboarding. Error kinds come from `src/ai` (AiError) and the offline engine; a new
 * provider or service (e.g. Chompbook AI with its subscription errors) extends this one file.
 */
import { AiError } from "../ai/client";
import { PROVIDERS } from "../ai/providers";
import type { AiErrorKind } from "../core/aiStatus";
import { OfflineError } from "../core/offline";
import type { ProviderId } from "../core/types";
import { CourseFinishedError } from "../data/sessionService";
import type { Key, T } from "../i18n";

const AI_ERR: Record<AiErrorKind, Key> = {
  "no-key": "aiErr.noKey",
  auth: "aiErr.auth",
  credits: "aiErr.credits",
  rate: "aiErr.rate",
  overloaded: "aiErr.overloaded",
  network: "aiErr.network",
  "bad-response": "aiErr.badResponse",
  api: "aiErr.api",
  aborted: "aiErr.aborted",
};

/** Extra line under an AI error: a fix-it hint we know, or the provider's own words. */
export function aiErrorDetail(e: unknown, t: T): string | null {
  if (!(e instanceof AiError)) return null;
  if (e.provider === "yandex" && e.status === 403 && e.detail && /permission/i.test(e.detail)) return t("aiErr.yandexPermission");
  const lines: string[] = [];
  if (e.detail && e.kind !== "aborted" && e.kind !== "network" && e.kind !== "no-key") lines.push(t("aiErr.detail", { text: e.detail.slice(0, 300) }));
  // a busy or confused model is often fine on another model of the same provider
  if (e.provider && e.provider !== "anthropic" && (e.kind === "overloaded" || e.kind === "bad-response")) lines.push(t("aiErr.otherModel"));
  // free OpenRouter: a daily cap (50 requests without credits) or shared models busy at peak hours
  if (e.provider === "openrouter" && e.kind === "rate") lines.push(t(e.detail && /per[ _-]?day/i.test(e.detail) ? "aiErr.orDaily" : "aiErr.orBusy"));
  return lines.length ? lines.join("\n") : null;
}

export function aiErrorText(e: unknown, t: T): string {
  if (e instanceof AiError) return t(AI_ERR[e.kind] ?? "aiErr.api") + ((e.kind === "api" || e.kind === "overloaded" || e.kind === "rate") && e.status ? ` (${e.status})` : "");
  if (e instanceof OfflineError) return t(e.code === "no-sources" ? "offline.err.noSources" : "offline.err.finished");
  if (e instanceof CourseFinishedError) return t("course.finished");
  return e instanceof Error ? e.message : String(e);
}

/** Display name of a provider (brands stay as is; Alice AI and Custom API are translated). */
export function providerName(id: ProviderId, t: T): string {
  if (id === "yandex") return t("provider.yandex");
  if (id === "custom") return t("provider.custom");
  return PROVIDERS[id].name;
}
