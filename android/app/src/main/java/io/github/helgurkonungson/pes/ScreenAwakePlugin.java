package io.github.helgurkonungson.pes;

import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Keeps the screen on while an AI lesson is being written, so the phone does not
 * fall asleep (and pause the app) in the middle. No permission is needed:
 * FLAG_KEEP_SCREEN_ON only applies while the app is in the foreground.
 */
@CapacitorPlugin(name = "ScreenAwake")
public class ScreenAwakePlugin extends Plugin {

    @PluginMethod
    public void keepOn(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }

    @PluginMethod
    public void allowSleep(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }
}
