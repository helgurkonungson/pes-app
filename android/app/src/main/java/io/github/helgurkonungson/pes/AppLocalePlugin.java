package io.github.helgurkonungson.pes;

import android.app.LocaleManager;
import android.os.Build;
import android.os.LocaleList;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Android 13+ per-app language (Settings → Apps → Chompbook → Language, res/xml/locales_config.xml).
 * The web layer keeps it in step with the language chosen inside the app (src/core/appLanguage.ts).
 */
@CapacitorPlugin(name = "AppLocale")
public class AppLocalePlugin extends Plugin {

    @PluginMethod
    public void get(PluginCall call) {
        JSObject ret = new JSObject();
        String tag = "";
        boolean supported = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            LocaleManager manager = getContext().getSystemService(LocaleManager.class);
            if (manager != null) {
                supported = true;
                LocaleList list = manager.getApplicationLocales();
                if (!list.isEmpty()) tag = list.get(0).toLanguageTag();
            }
        }
        ret.put("supported", supported);
        ret.put("tag", tag);
        call.resolve(ret);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String tag = call.getString("tag", "");
        getActivity().runOnUiThread(() -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                LocaleManager manager = getContext().getSystemService(LocaleManager.class);
                if (manager != null) {
                    manager.setApplicationLocales(tag == null || tag.isEmpty() ? LocaleList.getEmptyLocaleList() : LocaleList.forLanguageTags(tag));
                }
            }
            call.resolve();
        });
    }
}
