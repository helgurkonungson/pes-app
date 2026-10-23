import { describe, expect, it } from "vitest";
import type { UpdateInfo } from "./types";
import { isUpdateCheckDue, notesPreview, pendingUpdate } from "./updateCheck";

const info = (version: string): UpdateInfo => ({ version, notes: "n", pageUrl: "https://x", publishedAt: "2026-10-24T08:00:00Z" });

describe("daily update check", () => {
  it("is due on the first launch ever and on the first launch of a new day", () => {
    expect(isUpdateCheckDue(undefined, "2026-10-24")).toBe(true);
    expect(isUpdateCheckDue({ day: "2026-10-23" }, "2026-10-24")).toBe(true);
  });
  it("is not due again the same day, whatever it found", () => {
    expect(isUpdateCheckDue({ day: "2026-10-24" }, "2026-10-24")).toBe(false);
    expect(isUpdateCheckDue({ day: "2026-10-24", available: info("9.0.0") }, "2026-10-24")).toBe(false);
  });
  it("keeps showing a found update until the app is updated", () => {
    expect(pendingUpdate({ day: "2026-10-24", available: info("0.6.0") }, "0.5.1")?.version).toBe("0.6.0");
    expect(pendingUpdate({ day: "2026-10-24", available: info("0.6.0") }, "0.6.0")).toBeNull();
    expect(pendingUpdate({ day: "2026-10-24", available: info("v0.6.0") }, "0.7.0")).toBeNull();
    expect(pendingUpdate({ day: "2026-10-24" }, "0.5.1")).toBeNull();
    expect(pendingUpdate(undefined, "0.5.1")).toBeNull();
  });
  it("release notes preview: no heading, cut at a line break", () => {
    expect(notesPreview("## 0.6.0 — 2026-10-24\n\n- One\n- Two")).toBe("- One\n- Two");
    const long = Array.from({ length: 100 }, (_, i) => `- line ${i} with some words`).join("\n");
    const p = notesPreview(long, 200);
    expect(p.length).toBeLessThanOrEqual(203);
    expect(p.endsWith("\n…")).toBe(true);
    expect(p.split("\n").slice(0, -1).every((l) => /^- line \d+ with some words$/.test(l))).toBe(true);
  });
});
