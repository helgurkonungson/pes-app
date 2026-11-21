package io.github.helgurkonungson.pes;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Not the RuStore build: Pro is sold through RevenueCat here (ADR-037, ADR-041). This stub only keeps
 * MainActivity the same for every store flavor; the real plugin is in src/rustore (ADR-042).
 */
@CapacitorPlugin(name = "RuStorePay")
public class RuStorePayPlugin extends Plugin {

    private void unavailable(PluginCall call) {
        call.reject("RuStore Pay is only in the RuStore build");
    }

    @PluginMethod
    public void availability(PluginCall call) {
        unavailable(call);
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        unavailable(call);
    }

    @PluginMethod
    public void getPurchases(PluginCall call) {
        unavailable(call);
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        unavailable(call);
    }
}
