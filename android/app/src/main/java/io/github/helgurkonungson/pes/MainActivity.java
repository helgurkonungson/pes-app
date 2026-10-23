package io.github.helgurkonungson.pes;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.ActionBar;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Switch from the launch (splash) theme to the no-action-bar theme BEFORE
        // anything touches the window: EdgeToEdge.enable() creates the decor view,
        // and a decor created with the launch theme could get a native title bar.
        setTheme(R.style.AppTheme_NoActionBar);
        // Draw behind the system bars on every Android version; the SystemBars
        // plugin (insetsHandling: "css") passes the insets to the web layer.
        EdgeToEdge.enable(this);
        // Local plugins must be registered before the bridge starts.
        registerPlugin(ScreenAwakePlugin.class);
        super.onCreate(savedInstanceState);
        // Belt and braces: the web layer has its own top bar.
        ActionBar bar = getSupportActionBar();
        if (bar != null) bar.hide();
        if (getActionBar() != null) getActionBar().hide();
    }
}
