/** AI token accounting: per lesson (stored with it) and per calendar month (profile). */
import type { TokenUsage } from "../core/types";
import { db } from "../data/db";

export function addUsage(a: TokenUsage | undefined, b: TokenUsage): TokenUsage {
  return { input: (a?.input ?? 0) + b.input, output: (a?.output ?? 0) + b.output, requests: (a?.requests ?? 0) + b.requests };
}

export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Adds one request's tokens to this month's total. Best effort, never throws. */
export async function recordMonthly(u: TokenUsage): Promise<void> {
  try {
    await db.transaction("rw", db.profile, async () => {
      const p = await db.profile.get("me");
      if (!p) return;
      const k = monthKey();
      await db.profile.put({ ...p, usage: { ...(p.usage ?? {}), [k]: addUsage(p.usage?.[k], u) } });
    });
  } catch {
    /* accounting must never break a lesson */
  }
}

/** "12 400" / "1.2M" style. */
export function formatTokens(n: number, locale: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })}M`;
  return n.toLocaleString(locale);
}
