/**
 * Chompbook Pro (ADR-037) — the pure part: which store packages to show and how, whether the
 * entitlement is active, and the daily allowance. The store SDK lives in src/pro/purchases.ts.
 */

export const PRO_ENTITLEMENT = "pro";
/** Rough size of one 15-minute AI lesson in tokens — the server uses the same number (api/src/logic.ts). */
export const TOKENS_PER_LESSON = 60_000;

/** The subset of a RevenueCat package the paywall needs (kept small so tests don't need the SDK). */
export interface StorePackage {
  identifier: string;
  packageType: string; // "MONTHLY" | "ANNUAL" | …
  product: {
    identifier: string;
    priceString: string;
    price: number;
    currencyCode: string;
    pricePerMonthString?: string | null;
    subscriptionPeriod?: string | null; // ISO 8601, e.g. "P1M"
    introPrice?: { price: number; periodNumberOfUnits: number; periodUnit: string } | null;
    defaultOption?: { freePhase?: { billingPeriod?: { iso8601?: string } | null } | null } | null;
  };
}

export type PlanKind = "annual" | "monthly" | "other";

export interface PlanView {
  id: string;
  kind: PlanKind;
  price: string;
  /** "≈ 3,33 € / month" for the annual plan. */
  perMonth: string | null;
  trialDays: number | null;
  /** Saving of the annual plan against 12 monthly payments, whole percent. */
  savePct: number | null;
}

/** Days in an ISO 8601 period: P3D, P1W, P1M (30), P1Y (365). */
export function isoDays(iso: string | null | undefined): number | null {
  const m = (iso ?? "").match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/);
  if (!m || !m.slice(1).some(Boolean)) return null;
  const [y, mo, w, d] = m.slice(1).map((x) => Number(x ?? 0));
  return y * 365 + mo * 30 + w * 7 + d;
}

function unitDays(unit: string, n: number): number | null {
  const per: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };
  return per[unit] ? per[unit] * n : null;
}

/** Free-trial length: Google Play's free phase, or an intro price of 0. */
export function trialDays(p: StorePackage): number | null {
  const free = isoDays(p.product.defaultOption?.freePhase?.billingPeriod?.iso8601);
  if (free) return free;
  const intro = p.product.introPrice;
  if (intro && intro.price === 0) return unitDays(intro.periodUnit, intro.periodNumberOfUnits);
  return null;
}

export function kindOf(p: StorePackage): PlanKind {
  if (p.packageType === "ANNUAL" || p.product.subscriptionPeriod === "P1Y") return "annual";
  if (p.packageType === "MONTHLY" || p.product.subscriptionPeriod === "P1M") return "monthly";
  return "other";
}

/** Plans for the paywall: annual first (the better deal), then monthly, then anything else. */
export function toPlans(pkgs: StorePackage[]): PlanView[] {
  const monthly = pkgs.find((p) => kindOf(p) === "monthly");
  const order: Record<PlanKind, number> = { annual: 0, monthly: 1, other: 2 };
  return [...pkgs]
    .sort((a, b) => order[kindOf(a)] - order[kindOf(b)])
    .map((p) => {
      const kind = kindOf(p);
      const save =
        kind === "annual" && monthly && monthly.product.currencyCode === p.product.currencyCode && monthly.product.price > 0
          ? Math.round((1 - p.product.price / (monthly.product.price * 12)) * 100)
          : null;
      return {
        id: p.identifier,
        kind,
        price: p.product.priceString,
        perMonth: kind === "annual" ? (p.product.pricePerMonthString ?? null) : null,
        trialDays: trialDays(p),
        savePct: save !== null && save > 0 ? save : null,
      };
    });
}

/** Subset of RevenueCat's CustomerInfo. */
export interface CustomerInfoLike {
  entitlements: { active: Record<string, { expirationDate?: string | null; willRenew?: boolean; periodType?: string } | undefined> };
  managementURL?: string | null;
}

export interface ProStatus {
  active: boolean;
  /** ISO date the current period ends (null = lifetime or not active). */
  until: string | null;
  willRenew: boolean;
  trial: boolean;
}

export function proStatus(info: CustomerInfoLike | null | undefined): ProStatus {
  const e = info?.entitlements.active[PRO_ENTITLEMENT];
  if (!e) return { active: false, until: null, willRenew: false, trial: false };
  return { active: true, until: e.expirationDate ?? null, willRenew: e.willRenew !== false, trial: e.periodType === "TRIAL" };
}

export interface ProUsage {
  limit: number;
  used: number;
  left: number;
  resetAt: string;
}

/** Share of today's allowance used (0..1) and the lessons it still covers, roughly. */
export function usageView(u: ProUsage | null | undefined): { ratio: number; lessonsLeft: number } | null {
  if (!u || !(u.limit > 0)) return null;
  return { ratio: Math.min(1, Math.max(0, u.used / u.limit)), lessonsLeft: Math.max(0, Math.floor(u.left / TOKENS_PER_LESSON)) };
}

/** Google Play's subscription page for this app (cancel, change plan, payment method). */
export function manageSubscriptionUrl(appId: string, productId?: string): string {
  const base = `https://play.google.com/store/account/subscriptions?package=${encodeURIComponent(appId)}`;
  return productId ? `${base}&sku=${encodeURIComponent(productId)}` : base;
}
