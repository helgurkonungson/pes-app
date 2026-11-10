package io.github.helgurkonungson.pes;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Google Play flavor: purchases are configured by the RevenueCat Capacitor plugin (ADR-037).
 * This stub only keeps MainActivity the same for both flavors (ADR-041).
 */
@CapacitorPlugin(name = "GalaxyPurchases")
public class GalaxyPurchasesPlugin extends Plugin {

    @PluginMethod
    public void configure(PluginCall call) {
        call.reject("Samsung IAP is only in the Galaxy Store build");
    }
}
