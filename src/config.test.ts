/**
 * Guards for things that would silently wipe or orphan installed users' data
 * on update: the app id and the WebView origin (IndexedDB is per origin).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../capacitor.config";
import { DB_VERSION, PesDb } from "./data/db";

describe("update safety", () => {
  it("keeps the application id", () => {
    expect(config.appId).toBe("io.github.helgurkonungson.pes");
    const gradle = readFileSync(new URL("../android/app/build.gradle", import.meta.url), "utf8");
    expect(gradle).toContain('applicationId "io.github.helgurkonungson.pes"');
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
        expect(readFileSync(res(`mipmap-${d}/${f}.png`)).subarray(1, 4).toString()).toBe("PNG");
  });
});
