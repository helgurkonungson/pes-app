import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.github.helgurkonungson.pes",
  appName: "PES",
  webDir: "dist",
  backgroundColor: "#141517",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "DARK",
    },
    CapacitorHttp: {
      enabled: false,
    },
  },
};

export default config;
