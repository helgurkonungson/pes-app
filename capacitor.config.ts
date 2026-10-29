import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "online.chompbook.app",
  appName: "Chompbook",
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
    // Google sign-in only (creating the learner's Gemini key); no Facebook SDK, no AD_ID permission
    SocialLogin: {
      providers: { google: true, facebook: false, apple: false, twitter: false },
      logLevel: 1,
    },
  },
};

export default config;
