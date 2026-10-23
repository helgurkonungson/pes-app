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
