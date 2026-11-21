package io.github.helgurkonungson.pes;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * RuStore flavor: Pro is sold through RuStore Pay (RuStorePayPlugin, ADR-042), not RevenueCat.
 * This stub only keeps MainActivity the same for every flavor (ADR-041).
 */
@CapacitorPlugin(name = "GalaxyPurchases")
public class GalaxyPurchasesPlugin extends Plugin {

    @PluginMethod
    public void configure(PluginCall call) {
        call.reject("Samsung IAP is only in the Galaxy Store build");
    }
}
