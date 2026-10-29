/**
 * Guards for things that would silently wipe or orphan installed users' data
 * on update: the app id and the WebView origin (IndexedDB is per origin).
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../capacitor.config";
import { DB_VERSION, PesDb } from "./data/db";

describe("update safety", () => {
  it("keeps the application id", () => {
    expect(config.appId).toBe("online.chompbook.app");
    const gradle = readFileSync(new URL("../android/app/build.gradle", import.meta.url), "utf8");
    expect(gradle).toContain('applicationId "online.chompbook.app"');
  });
  it("the emulator smoke test starts the real activity (its class keeps the Java namespace)", () => {
    const gradle = readFileSync(new URL("../android/app/build.gradle", import.meta.url), "utf8");
    const namespace = gradle.match(/namespace\s*=?\s*"([^"]+)"/)?.[1];
    const smoke = readFileSync(new URL("../scripts/android-smoke.sh", import.meta.url), "utf8");
    expect(smoke).toContain(`PKG=${config.appId}`);
    // "am start -n <app id>/.MainActivity" resolves against the app id, not the namespace → "Error type 3"
    expect(smoke).toContain(`ACTIVITY=${namespace}.MainActivity`);
  });
  it("keeps the default WebView origin (https://localhost) so IndexedDB survives updates", () => {
    const server = (config as { server?: Record<string, unknown> }).server ?? {};
    expect(server.hostname ?? "localhost").toBe("localhost");
    expect(server.androidScheme ?? "https").toBe("https");
    expect(server.url).toBeUndefined();
  });
  it("database name and version move only forward", () => {
    const db = new PesDb("guard-test");
    expect(db.name).toBe("guard-test");
    expect(new PesDb().name).toBe("pes");
    expect(DB_VERSION).toBeGreaterThanOrEqual(2);
    expect(db.verno).toBe(DB_VERSION);
  });
  it("the Android theme never shows a native action bar", () => {
    const styles = readFileSync(new URL("../android/app/src/main/res/values/styles.xml", import.meta.url), "utf8");
    expect(styles).not.toMatch(/DarkActionBar|Light\.ActionBar/);
    expect(styles).toMatch(/AppTheme" parent="Theme\.AppCompat\.DayNight\.NoActionBar"/);
    expect(styles).toContain("postSplashScreenTheme");
    const activity = readFileSync(new URL("../android/app/src/main/java/io/github/helgurkonungson/pes/MainActivity.java", import.meta.url), "utf8");
    expect(activity.indexOf("setTheme(R.style.AppTheme_NoActionBar);")).toBeGreaterThan(0);
    expect(activity.indexOf("setTheme(R.style.AppTheme_NoActionBar);")).toBeLessThan(activity.indexOf("EdgeToEdge.enable(this);"));
    expect(activity).toContain("bar.hide()");
  });
});

describe("keep-awake plugin", () => {
  it("is registered before the bridge starts and only toggles FLAG_KEEP_SCREEN_ON", () => {
    const dir = "../android/app/src/main/java/io/github/helgurkonungson/pes/";
    const activity = readFileSync(new URL(`${dir}MainActivity.java`, import.meta.url), "utf8");
    expect(activity.indexOf("registerPlugin(ScreenAwakePlugin.class);")).toBeGreaterThan(0);
    expect(activity.indexOf("registerPlugin(ScreenAwakePlugin.class);")).toBeLessThan(activity.indexOf("super.onCreate(savedInstanceState);"));
    const plugin = readFileSync(new URL(`${dir}ScreenAwakePlugin.java`, import.meta.url), "utf8");
    expect(plugin).toContain('@CapacitorPlugin(name = "ScreenAwake")');
    expect(plugin).toContain("FLAG_KEEP_SCREEN_ON");
  });
});

describe("branding", () => {
  const res = (p: string) => new URL(`../android/app/src/main/res/${p}`, import.meta.url);
  it("names the app Chompbook, and Грызи for Russian phones", () => {
    expect(readFileSync(res("values/strings.xml"), "utf8")).toContain('<string name="app_name">Chompbook</string>');
    expect(readFileSync(res("values-ru/strings.xml"), "utf8")).toContain('<string name="app_name">Грызи</string>');
  });
  it("ships an adaptive icon with a themed (monochrome) layer at every density", () => {
    for (const f of ["ic_launcher", "ic_launcher_round"]) {
      const xml = readFileSync(res(`mipmap-anydpi-v26/${f}.xml`), "utf8");
      expect(xml).toContain("@mipmap/ic_launcher_foreground");
      expect(xml).toContain("@mipmap/ic_launcher_monochrome");
    }
    for (const d of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"])
      for (const f of ["ic_launcher", "ic_launcher_round", "ic_launcher_foreground", "ic_launcher_monochrome"])
        expect(readFileSync(res(`mipmap-${d}/${f}.webp`)).subarray(8, 12).toString()).toBe("WEBP");
  });
  it("Android images are WebP only (smaller APK) — a PNG of the same name would be a duplicate resource", () => {
    const pngs = readdirSync(res(""), { recursive: true }).filter((f) => String(f).endsWith(".png"));
    expect(pngs).toEqual([]);
  });
  it("release builds are shrunk by R8 and keep the plugin classes Capacitor finds by reflection", () => {
    const gradle = readFileSync(new URL("../android/app/build.gradle", import.meta.url), "utf8");
    expect(gradle).toMatch(/minifyEnabled true/);
    expect(gradle).toMatch(/shrinkResources true/);
    const rules = readFileSync(new URL("../android/app/proguard-rules.pro", import.meta.url), "utf8");
    for (const pkg of ["com.getcapacitor", "com.capacitorjs.plugins", "com.aparajita.capacitor", "ee.forgr.capacitor", "io.ionic.libs"]) expect(rules).toContain(`-keep class ${pkg}.`);
    expect(readFileSync(res("raw/keep.xml"), "utf8")).toContain("@drawable/ic_stat_notify");
  });
  it("the OpenRouter sign-in can come back to the app (deep link + callback page)", () => {
    const manifest = readFileSync(new URL("../android/app/src/main/AndroidManifest.xml", import.meta.url), "utf8");
    expect(manifest).toMatch(/<data android:scheme="online\.chompbook\.app" android:host="oauth" \/>/);
    expect(manifest).toContain('android:launchMode="singleTask"');
    const page = readFileSync(new URL("../site/public/oauth/openrouter/index.html", import.meta.url), "utf8");
    expect(page).toContain('"#Intent;scheme=" + id + ";package=" + id + ";end"');
    expect(page).toContain('"online.chompbook.app" : "io.github.helgurkonungson.pes"');
    expect(page).toContain("pes-oauth");
  });
});
