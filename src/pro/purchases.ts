/**
 * Chompbook Pro purchases through RevenueCat on top of Google Play Billing (ADR-037) or, in the
 * Galaxy Store build, Samsung IAP (ADR-041). Only the Android app sells Pro (the web version shows where to get it).
 * When the "pro" entitlement is active the learner's RevenueCat app user id becomes the "key"
 * of the Chompbook AI provider; the server checks it with RevenueCat on every request.
 *
 * The RuStore build (ADR-042) goes around RevenueCat, which doesn't support RuStore: RuStore Pay
 * sells the subscription, and `rustore:<product>:<purchase id>` is the key the server checks with RuStore.
 */
import { Capacitor } from "@capacitor/core";
import { Purchases, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { create } from "zustand";
import { getApiKey, setApiKey } from "../ai/key";
import { GALAXY_BILLING_TEST, PRO_API, REVENUECAT_KEY as RC_KEY, RUSTORE_PAY, RUSTORE_PRODUCTS, STORE } from "../build";
import { nowIso } from "../core/ids";
import { type CustomerInfoLike, type PlanView, type ProStatus, type ProUsage, proStatus, ruStoreActive, ruStoreKey, ruStorePlans, ruStoreStatus, type StorePackage, toPlans } from "../core/pro";
import { getProfile, updateProfile } from "../data/db";
import { logEvent } from "../data/logs";
import { locale } from "../i18n";
import { configureGalaxyPurchases } from "../native/galaxyPurchases";
import { isRuStoreCancel, ruStoreProducts, ruStorePurchase, ruStorePurchases } from "../native/rustorePay";

const rustore = STORE === "rustore";

/** Pro can be bought here: the Android app with the store configured (the build has the store's RevenueCat key). */
export function proPurchasable(): boolean {
  if (Capacitor.getPlatform() !== "android") return false;
  return rustore ? RUSTORE_PAY : !!RC_KEY;
}

interface ProState {
  status: ProStatus;
  managementUrl: string | null;
  set: (s: Partial<Pick<ProState, "status" | "managementUrl">>) => void;
}

export const usePro = create<ProState>((set) => ({
  status: { active: false, until: null, willRenew: false, trial: false },
  managementUrl: null,
  set: (s) => set(s),
}));

let configured: Promise<void> | null = null;
let packages: PurchasesPackage[] = [];

/** Configures the SDK once (app start) and follows subscription changes (renewal, expiry, refunds). */
export function initPro(): Promise<void> {
  if (!proPurchasable()) return Promise.resolve();
  configured ??= (async () => {
    if (rustore) return applyRuStore(); // RuStore Pay needs no setup: the app id is in the manifest
    if (STORE === "galaxy") {
      // Samsung IAP: configured natively; the plugin's update listener isn't attached there, so the
      // state is read at start, after a purchase or restore, and when the app comes back (refreshPro).
      await configureGalaxyPurchases(RC_KEY, GALAXY_BILLING_TEST);
    } else {
      await Purchases.configure({ apiKey: RC_KEY });
      await Purchases.addCustomerInfoUpdateListener((info) => void applyCustomerInfo(info as unknown as CustomerInfoLike));
    }
    const { customerInfo } = await Purchases.getCustomerInfo();
    await applyCustomerInfo(customerInfo as unknown as CustomerInfoLike);
  })().catch((e) => {
    configured = null;
    void logEvent("pro", `init failed: ${String(e)}`);
  });
  return configured;
}

/**
 * Turns an active subscription into a working AI: saves the Pro "key" and switches to Chompbook AI
 * the first time it becomes active (later the learner may choose another AI in Settings).
 */
export async function applyCustomerInfo(info: CustomerInfoLike): Promise<void> {
  const status = proStatus(info);
  usePro.getState().set({ status, managementUrl: info.managementURL ?? null });
  await applyStatus(status, async () => (await Purchases.getAppUserID()).appUserID);
}

/** When this session last bought Pro in RuStore: the purchase list may not show it for a while. */
let ruBoughtAt = 0;
const RU_LAG_MS = 15 * 60_000;

/** RuStore build: the subscription from RuStore Pay's purchase list. */
async function applyRuStore(): Promise<void> {
  const purchases = await ruStorePurchases();
  const now = Date.now();
  const status = ruStoreStatus(purchases, RUSTORE_PRODUCTS, now);
  // returning from the payment sheet triggers a refresh before RuStore lists the new subscription
  if (!status.active && now - ruBoughtAt < RU_LAG_MS) return;
  const sub = ruStoreActive(purchases, RUSTORE_PRODUCTS, now);
  usePro.getState().set({ status, managementUrl: null });
  await applyStatus(status, async () => ruStoreKey(sub!.productId!, sub!.purchaseId));
}

async function applyStatus(status: ProStatus, key: () => Promise<string>): Promise<void> {
  const p = await getProfile();
  if (status.active) {
    const appUserID = await key();
    if ((await getApiKey("chompbook")) !== appUserID) await setApiKey(appUserID, "chompbook");
    const first = !p.pro?.active;
    await updateProfile({
      pro: { active: true, since: p.pro?.since ?? nowIso(), until: status.until ?? undefined },
      ...(first ? { provider: "chompbook", aiBlock: undefined, aiMode: p.aiMode === "offline" ? undefined : p.aiMode } : {}),
      ...(p.provider === "chompbook" && p.aiBlock ? { aiBlock: undefined } : {}),
    });
  } else if (p.pro?.active) {
    await updateProfile({ pro: { ...p.pro, active: false } });
  }
}

/** Re-reads the subscription when the app returns to the foreground (Galaxy build: renewals, expiry, refunds). */
export async function refreshPro(): Promise<void> {
  if (!proPurchasable() || STORE === "play" || !configured) return;
  try {
    await configured;
    if (rustore) return await applyRuStore();
    const { customerInfo } = await Purchases.getCustomerInfo();
    await applyCustomerInfo(customerInfo as unknown as CustomerInfoLike);
  } catch (e) {
    void logEvent("pro", `refresh failed: ${String(e)}`);
  }
}

export async function loadPlans(): Promise<PlanView[]> {
  await initPro();
  if (rustore) {
    const plans = ruStorePlans(await ruStoreProducts(RUSTORE_PRODUCTS), locale());
    if (!plans.length) throw new Error("No RuStore subscriptions");
    return plans;
  }
  const offerings = await Purchases.getOfferings();
  packages = offerings.current?.availablePackages ?? [];
  return toPlans(packages as unknown as StorePackage[]);
}

export type BuyResult = "ok" | "cancelled";

/** RevenueCat's "the user closed the store's payment sheet" (PURCHASE_CANCELLED_ERROR = "1"). */
function isCancel(e: unknown): boolean {
  const x = e as { userCancelled?: boolean | null; code?: string | number; data?: { userCancelled?: boolean | null } } | null;
  return !!(x?.userCancelled || x?.data?.userCancelled || String(x?.code) === "1");
}

export async function buy(planId: string): Promise<BuyResult> {
  if (rustore) return buyRuStore(planId);
  const pkg = packages.find((p) => p.identifier === planId);
  if (!pkg) throw new Error("Plan not found");
  try {
    const r = await Purchases.purchasePackage({ aPackage: pkg });
    await applyCustomerInfo(r.customerInfo as unknown as CustomerInfoLike);
    return "ok";
  } catch (e) {
    if (isCancel(e)) return "cancelled";
    void logEvent("pro", `purchase failed: ${String((e as Error).message ?? e)}`);
    throw e;
  }
}

async function buyRuStore(productId: string): Promise<BuyResult> {
  const dark = document.documentElement.dataset.theme !== "light"; // theme.ts marks only the light theme
  try {
    const r = await ruStorePurchase(productId, undefined, dark);
    // the purchase list can lag behind the payment, so the result itself switches Pro on; the list
    // is read again when the app next comes to the foreground (refreshPro)
    const status: ProStatus = { active: true, until: null, willRenew: true, trial: false };
    ruBoughtAt = Date.now();
    usePro.getState().set({ status });
    await applyStatus(status, async () => ruStoreKey(r.productId || productId, r.purchaseId));
    return "ok";
  } catch (e) {
    if (isRuStoreCancel(e)) return "cancelled";
    void logEvent("pro", `RuStore purchase failed: ${String((e as Error).message ?? e)}`);
    throw e;
  }
}

/** "Restore purchases": a new phone or a reinstall with the same store account (Google / Samsung / RuStore). */
export async function restore(): Promise<boolean> {
  await initPro();
  if (rustore) {
    await applyRuStore();
    return usePro.getState().status.active;
  }
  const { customerInfo } = await Purchases.restorePurchases();
  await applyCustomerInfo(customerInfo as unknown as CustomerInfoLike);
  return proStatus(customerInfo as unknown as CustomerInfoLike).active;
}

/** Today's Chompbook AI allowance from the server. */
export async function fetchUsage(): Promise<ProUsage | null> {
  const key = await getApiKey("chompbook");
  if (!key) return null;
  try {
    const res = await fetch(`${PRO_API}/usage`, { headers: { authorization: `Bearer ${key}` } });
    if (!res.ok) return null;
    return (await res.json()) as ProUsage;
  } catch {
    return null;
  }
}
