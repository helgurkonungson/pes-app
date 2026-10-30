package io.github.helgurkonungson.pes;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Saves what the home-screen widget shows (src/native/widget.ts) and redraws it. */
@CapacitorPlugin(name = "HomeWidget")
public class HomeWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context context = getContext();
        Integer streak = call.getInt("streak", 0);
        SharedPreferences.Editor e = context.getSharedPreferences(StreakWidget.PREFS, Context.MODE_PRIVATE).edit();
        e.putString("day", call.getString("day", ""));
        e.putInt("streak", streak == null ? 0 : streak);
        e.putString("streakLabel", call.getString("streakLabel", ""));
        e.putString("status", call.getString("status", ""));
        e.putString("newDayStatus", call.getString("newDayStatus", ""));
        e.putString("cta", call.getString("cta", ""));
        e.apply();
        StreakWidget.updateAll(context);
        call.resolve();
    }
}
