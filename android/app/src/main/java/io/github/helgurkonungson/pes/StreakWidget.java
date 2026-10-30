package io.github.helgurkonungson.pes;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Home-screen widget (0.19.2): the day streak, today's goal and a "Study" button that opens
 * the app. The web layer writes the texts (already translated) through HomeWidgetPlugin;
 * on a new day the widget shows the "fresh day" status until the app refreshes it.
 */
public class StreakWidget extends AppWidgetProvider {
    static final String PREFS = "chompbook_widget";
    private static final String FLAME = "🔥";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        RemoteViews views = views(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    /** Redraws every placed widget (called after the app saved new data). */
    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, StreakWidget.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = views(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    static RemoteViews views(Context context) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_streak);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        boolean filled = p.contains("day");
        boolean sameDay = today.equals(p.getString("day", ""));
        v.setTextViewText(R.id.widget_streak, FLAME + " " + p.getInt("streak", 0));
        v.setTextViewText(R.id.widget_streak_label, text(p, "streakLabel", context.getString(R.string.widget_streak_label)));
        String status = filled ? text(p, sameDay ? "status" : "newDayStatus", context.getString(R.string.widget_empty)) : context.getString(R.string.widget_empty);
        v.setTextViewText(R.id.widget_status, status);
        v.setTextViewText(R.id.widget_cta, text(p, "cta", context.getString(R.string.widget_cta)));

        Intent open = new Intent(context, MainActivity.class);
        open.setAction(Intent.ACTION_MAIN);
        open.addCategory(Intent.CATEGORY_LAUNCHER);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        PendingIntent pending = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.widget_root, pending);
        return v;
    }

    private static String text(SharedPreferences p, String key, String fallback) {
        String s = p.getString(key, "");
        return s == null || s.isEmpty() ? fallback : s;
    }
}
