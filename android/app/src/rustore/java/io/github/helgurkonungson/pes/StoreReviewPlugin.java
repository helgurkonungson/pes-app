package io.github.helgurkonungson.pes;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * RuStore flavor (ADR-042): no Google Play In-App Review here. The web layer doesn't ask in
 * this build; the stub keeps MainActivity the same for every flavor.
 */
@CapacitorPlugin(name = "StoreReview")
public class StoreReviewPlugin extends Plugin {

    @PluginMethod
    public void request(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("launched", false);
        call.resolve(ret);
    }
}
