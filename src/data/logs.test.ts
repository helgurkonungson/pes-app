import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { addUsage, formatTokens, monthKey } from "../ai/usage";
import { db } from "./db";
import { logEvent, logText, redact } from "./logs";

describe("error log", () => {
  it("never keeps anything that looks like a key", () => {
    const s = redact("401 for sk-ant-api03-abcdefghijkl and AIzaSyA1234567890abcdefghijklmn, Bearer abc.def.ghi.jkl");
    expect(s).not.toMatch(/sk-ant|AIza|abc\.def/);
    expect(s.match(/\[hidden\]/g)).toHaveLength(3);
  });
  it("stores redacted entries and keeps only the last 200", async () => {
    for (let i = 0; i < 205; i++) await logEvent("error", `boom ${i}`, i === 204 ? "key sk-ant-secretsecret" : undefined);
    expect(await db.logs.count()).toBe(200);
    const text = await logText();
    expect(text).toContain("boom 204");
    expect(text).not.toContain("boom 4\n");
    expect(text).not.toContain("secretsecret");
  });
});

describe("token usage", () => {
  it("adds up and formats", () => {
    expect(addUsage(undefined, { input: 10, output: 5, requests: 1 })).toEqual({ input: 10, output: 5, requests: 1 });
    expect(addUsage({ input: 1, output: 2, requests: 3 }, { input: 10, output: 5, requests: 1 })).toEqual({ input: 11, output: 7, requests: 4 });
    expect(monthKey(new Date(2026, 0, 5))).toBe("2026-01");
    expect(formatTokens(2_345_678, "en")).toBe("2.3M");
    expect(formatTokens(12_400, "en")).toBe("12,400");
  });
});
