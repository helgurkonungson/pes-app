package io.github.helgurkonungson.pes;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Draw behind the system bars on every Android version; the SystemBars
        // plugin (insetsHandling: "css") passes the insets to the web layer.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
