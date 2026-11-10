/**
 * Samsung Galaxy Store purchases (ADR-041). The RevenueCat Capacitor plugin only configures the
 * Google Play and Amazon stores, so in the `galaxy` Android flavor our GalaxyPurchases plugin
 * configures the same native RevenueCat SDK for Samsung IAP; everything after that (offerings,
 * purchase, restore, customer info) goes through the RevenueCat plugin as usual.
 */
import { registerPlugin } from "@capacitor/core";

interface GalaxyPurchasesPlugin {
  configure(o: { apiKey: string; test: boolean }): Promise<void>;
}

const GalaxyPurchases = registerPlugin<GalaxyPurchasesPlugin>("GalaxyPurchases");

export function configureGalaxyPurchases(apiKey: string, test: boolean): Promise<void> {
  return GalaxyPurchases.configure({ apiKey, test });
}
