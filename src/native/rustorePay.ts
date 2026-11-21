/**
 * RuStore Pay (ADR-042): the RuStorePay plugin of the `rustore` Android flavor
 * (android/app/src/rustore/kotlin/…/RuStorePayPlugin.kt). Other flavors have a stub that rejects.
 */
import { registerPlugin } from "@capacitor/core";
import type { RuStoreProduct, RuStorePurchase } from "../core/pro";

export interface RuStorePurchaseResult {
  purchaseId: string;
  productId: string;
  invoiceId?: string | null;
  sandbox?: boolean;
}

interface RuStorePayPlugin {
  /** Whether payments work for this app and this user right now (monetization on, nothing blocked). */
  availability(): Promise<{ available: boolean; reason?: string }>;
  getProducts(o: { ids: string[] }): Promise<{ products: RuStoreProduct[] }>;
  getPurchases(): Promise<{ purchases: RuStorePurchase[] }>;
  /** Rejects with code "cancelled" when the learner closes the payment sheet. */
  purchase(o: { productId: string; appUserId?: string; dark?: boolean }): Promise<RuStorePurchaseResult>;
}

const RuStorePay = registerPlugin<RuStorePayPlugin>("RuStorePay");

export const ruStoreAvailability = () => RuStorePay.availability();
export const ruStoreProducts = (ids: string[]) => RuStorePay.getProducts({ ids }).then((r) => r.products);
export const ruStorePurchases = () => RuStorePay.getPurchases().then((r) => r.purchases);
export const ruStorePurchase = (productId: string, appUserId?: string, dark?: boolean) => RuStorePay.purchase({ productId, appUserId, dark });

/** The learner closed RuStore's payment sheet. */
export function isRuStoreCancel(e: unknown): boolean {
  const x = e as { code?: string; message?: string } | null;
  return x?.code === "cancelled" || /cancel/i.test(x?.message ?? "");
}
