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

/**
 * Where to manage the subscription (cancel, change plan, payment method) when the store gives no
 * link of its own: Google Play's subscription page for this app; for the Galaxy Store (ADR-041) the
 * app's page there — subscriptions live in Galaxy Store → Menu → Subscriptions; for RuStore
 * (ADR-042) the app's RuStore page — subscriptions live in RuStore → Profile → Subscriptions.
 */
export function manageSubscriptionUrl(appId: string, productId?: string, store: "play" | "galaxy" | "rustore" = "play"): string {
  if (store === "galaxy") return `https://galaxystore.samsung.com/detail/${encodeURIComponent(appId)}`;
  if (store === "rustore") return `https://www.rustore.ru/catalog/app/${encodeURIComponent(appId)}`;
  const base = `https://play.google.com/store/account/subscriptions?package=${encodeURIComponent(appId)}`;
  return productId ? `${base}&sku=${encodeURIComponent(productId)}` : base;
}

/** Days between two Pro offers after a lesson. */
export const PRO_OFFER_EVERY_DAYS = 7;

/**
 * Whether to offer Chompbook Pro on the result screen (1.1.0): right after the learner saw an
 * open answer checked — the moment the main feature makes sense — in a build that sells Pro, to
 * someone without it, adult or not asked yet, and at most once every PRO_OFFER_EVERY_DAYS days.
 */
export function shouldOfferPro(x: { purchasable: boolean; proActive: boolean; provider?: string; graded: boolean; lastOffer?: string; now: Date }): boolean {
  if (!x.purchasable || x.proActive || x.provider === "chompbook" || !x.graded) return false;
  if (!x.lastOffer) return true;
  const last = Date.parse(x.lastOffer);
  return !Number.isFinite(last) || x.now.getTime() - last >= PRO_OFFER_EVERY_DAYS * 86_400_000;
}

// ---------- RuStore (ADR-042) ----------

/** A RuStore subscription product as the RuStorePay plugin returns it. */
export interface RuStoreProduct {
  productId: string;
  type: string; // "SUBSCRIPTION" | …
  /** Formatted price with the currency sign, e.g. "249 ₽". */
  amountLabel: string;
  /** Minor units (kopecks); may be missing. */
  price?: number | null;
  currency?: string | null;
  /** ISO 8601 of the main period ("P1M", "P1Y") and of the free trial, if the product has one. */
  mainPeriod?: string | null;
  trialPeriod?: string | null;
}

/** A purchase from RuStore Pay `getPurchases` (subscriptions only matter here). */
export interface RuStorePurchase {
  purchaseId: string;
  productId?: string | null;
  /** "SUBSCRIPTION" for subscriptions. */
  kind: string;
  /** SubscriptionPurchaseStatus: ACTIVE, PAUSED, TERMINATED, CLOSED, EXPIRED, CANCELLED, … */
  status: string;
  /** Epoch ms of the end of the current term. */
  expirationDate?: number | null;
  purchaseTime?: number | null;
}

/** The Chompbook AI "key" of a RuStore subscription; the server checks it with RuStore (api/src/rustore.ts). */
export function ruStoreKey(productId: string, purchaseId: string): string {
  return `rustore:${productId}:${purchaseId}`;
}

function ruKind(p: RuStoreProduct): PlanKind {
  if (p.mainPeriod === "P1Y" || p.mainPeriod === "P12M" || /annual|year/i.test(p.productId)) return "annual";
  if (p.mainPeriod === "P1M" || /month/i.test(p.productId)) return "monthly";
  return "other";
}

function money(minor: number, currency: string, loc: string): string {
  try {
    return new Intl.NumberFormat(loc, { style: "currency", currency, maximumFractionDigits: minor % 100 === 0 ? 0 : 2 }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

/** RuStore products → paywall plans, in the same order and shape as the RevenueCat plans. */
export function ruStorePlans(products: RuStoreProduct[], loc = "ru-RU"): PlanView[] {
  const subs = products.filter((p) => p.type === "SUBSCRIPTION" && p.amountLabel);
  const monthly = subs.find((p) => ruKind(p) === "monthly");
  const order: Record<PlanKind, number> = { annual: 0, monthly: 1, other: 2 };
  return [...subs]
    .sort((a, b) => order[ruKind(a)] - order[ruKind(b)])
    .map((p) => {
      const kind = ruKind(p);
      const comparable = kind === "annual" && monthly && p.price && monthly.price && p.currency && p.currency === monthly.currency;
      const save = comparable ? Math.round((1 - p.price! / (monthly!.price! * 12)) * 100) : null;
      // round the monthly share up to whole kopecks
      const perMonth = kind === "annual" && p.price && p.currency ? money(Math.ceil(p.price / 12), p.currency, loc) : null;
      return {
        id: p.productId,
        kind,
        price: p.amountLabel,
        perMonth,
        trialDays: isoDays(p.trialPeriod),
        savePct: save !== null && save > 0 ? save : null,
      };
    });
}

/**
 * The learner's Pro subscription in RuStore: an ACTIVE subscription to one of our products whose
 * term hasn't ended (the latest one, if there are several). PAUSED = a failed renewal: not Pro.
 */
export function ruStoreActive(purchases: RuStorePurchase[], productIds: string[], now: number): RuStorePurchase | null {
  const live = purchases.filter(
    (p) => p.kind === "SUBSCRIPTION" && p.status === "ACTIVE" && !!p.productId && productIds.includes(p.productId) && (p.expirationDate == null || p.expirationDate > now),
  );
  if (!live.length) return null;
  return live.sort((a, b) => (b.expirationDate ?? Infinity) - (a.expirationDate ?? Infinity))[0];
}

export function ruStoreStatus(purchases: RuStorePurchase[], productIds: string[], now: number): ProStatus {
  const p = ruStoreActive(purchases, productIds, now);
  if (!p) return { active: false, until: null, willRenew: false, trial: false };
  // RuStore Pay doesn't say on the phone whether auto-renewal is on; an active subscription renews unless cancelled
  return { active: true, until: p.expirationDate ? new Date(p.expirationDate).toISOString() : null, willRenew: true, trial: false };
}
