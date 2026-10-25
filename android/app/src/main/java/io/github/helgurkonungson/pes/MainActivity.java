package io.github.helgurkonungson.pes;

import android.content.Intent;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.ActionBar;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

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

    // Google sign-in with extra scopes (creating the learner's Gemini key, ADR-021) returns
    // through an activity result that must be handed to the SocialLogin plugin.
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle handle = getBridge().getPlugin("SocialLogin");
            if (handle == null) return;
            Plugin plugin = handle.getInstance();
            if (plugin instanceof SocialLoginPlugin) ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
