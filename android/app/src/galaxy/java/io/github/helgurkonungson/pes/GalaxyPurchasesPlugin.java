package io.github.helgurkonungson.pes;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.revenuecat.purchases.Purchases;
import com.revenuecat.purchases.galaxy.GalaxyBillingMode;
import com.revenuecat.purchases.galaxy.GalaxyConfiguration;

/**
 * Chompbook Pro in the Galaxy Store build (ADR-041): configures the RevenueCat SDK for Samsung IAP.
 * The RevenueCat Capacitor plugin can only configure Google Play / Amazon; once the shared
 * Purchases instance exists, its other methods (offerings, purchase, restore) work as usual.
 */
@CapacitorPlugin(name = "GalaxyPurchases")
public class GalaxyPurchasesPlugin extends Plugin {

    @PluginMethod
    public void configure(PluginCall call) {
        String apiKey = call.getString("apiKey");
        if (apiKey == null || apiKey.isEmpty()) {
            call.reject("apiKey is required");
            return;
        }
        boolean test = Boolean.TRUE.equals(call.getBoolean("test", false));
        try {
            if (!Purchases.isConfigured()) {
                GalaxyBillingMode mode = test ? GalaxyBillingMode.TEST : GalaxyBillingMode.PRODUCTION;
                Purchases.configure(new GalaxyConfiguration.Builder(getContext().getApplicationContext(), apiKey, mode).build());
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Galaxy purchases setup failed", e);
        }
    }
}
