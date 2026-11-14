/**
 * Chompbook Pro purchases through RevenueCat on top of Google Play Billing (ADR-037).
 * Only the Android app sells Pro (the web version shows where to get it).
 * When the "pro" entitlement is active the learner's RevenueCat app user id becomes the "key"
 * of the Chompbook AI provider; the server checks it with RevenueCat on every request.
 */
import { Capacitor } from "@capacitor/core";
import { Purchases, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { create } from "zustand";
import { getApiKey, setApiKey } from "../ai/key";
import { PRO_API, REVENUECAT_ANDROID_KEY as RC_KEY } from "../build";
import { nowIso } from "../core/ids";
import { type CustomerInfoLike, type PlanView, type ProStatus, type ProUsage, proStatus, type StorePackage, toPlans } from "../core/pro";
import { getProfile, updateProfile } from "../data/db";
import { logEvent } from "../data/logs";

/** Pro can be bought here: the Android app with the store configured (the build has the RevenueCat key). */
export function proPurchasable(): boolean {
  return Capacitor.getPlatform() === "android" && !!RC_KEY;
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
    await Purchases.configure({ apiKey: RC_KEY });
    await Purchases.addCustomerInfoUpdateListener((info) => void applyCustomerInfo(info as unknown as CustomerInfoLike));
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
  const p = await getProfile();
  if (status.active) {
    const { appUserID } = await Purchases.getAppUserID();
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

export async function loadPlans(): Promise<PlanView[]> {
  await initPro();
  const offerings = await Purchases.getOfferings();
  packages = offerings.current?.availablePackages ?? [];
  return toPlans(packages as unknown as StorePackage[]);
}

export type BuyResult = "ok" | "cancelled";

/** RevenueCat's "the user closed the Google Play sheet" (PURCHASE_CANCELLED_ERROR = "1"). */
function isCancel(e: unknown): boolean {
  const x = e as { userCancelled?: boolean | null; code?: string | number; data?: { userCancelled?: boolean | null } } | null;
  return !!(x?.userCancelled || x?.data?.userCancelled || String(x?.code) === "1");
}

export async function buy(planId: string): Promise<BuyResult> {
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

/** "Restore purchases": a new phone or a reinstall with the same Google account. */
export async function restore(): Promise<boolean> {
  await initPro();
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
