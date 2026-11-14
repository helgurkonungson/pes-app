package io.github.helgurkonungson.pes;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

/**
 * Google Play In-App Review (0.19.2). The app asks at a good moment (src/core/reviewAsk.ts);
 * Google decides whether the card is actually shown and never tells the result.
 */
@CapacitorPlugin(name = "StoreReview")
public class StoreReviewPlugin extends Plugin {

    @PluginMethod
    public void request(PluginCall call) {
        ReviewManager manager = ReviewManagerFactory.create(getContext());
        manager.requestReviewFlow().addOnCompleteListener(task -> {
            JSObject ret = new JSObject();
            if (!task.isSuccessful() || getActivity() == null) {
                ret.put("launched", false);
                call.resolve(ret);
                return;
            }
            ReviewInfo info = task.getResult();
            manager.launchReviewFlow(getActivity(), info).addOnCompleteListener(done -> {
                ret.put("launched", true);
                call.resolve(ret);
            });
        });
    }
}
