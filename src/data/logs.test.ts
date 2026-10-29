import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { addUsage, formatTokens, monthKey } from "../ai/usage";
import { db, getProfile } from "./db";
import { logEvent, logText, redact } from "./logs";
import { autoSendLogs, sendLogsNow, setAutoReports } from "./logSend";

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

describe("sending the error log", () => {
  const URL = "https://chompbook.test/api/report";
  const okFetch = () => {
    const bodies: { logs: { auto: boolean; entries: { message: string }[] } }[] = [];
    const f = (async (_u: string, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    return { f, bodies };
  };

  it("does nothing without an endpoint and reports a failed delivery", async () => {
    await db.logs.clear();
    await logEvent("error", "first");
    expect(await sendLogsNow({ url: "" })).toBe(false);
    expect(await sendLogsNow({ url: URL, fetcher: (async () => new Response("", { status: 500 })) as unknown as typeof fetch })).toBe(false);
    expect(await sendLogsNow({ url: URL, fetcher: (async () => { throw new Error("offline"); }) as unknown as typeof fetch })).toBe(false);
  });

  it("automatic reports are off by default, start from the moment they are turned on and send each entry once", async () => {
    await db.logs.clear();
    await logEvent("error", "before");
    const { f, bodies } = okFetch();
    const now = new Date("2026-10-29T10:00:00Z");
    expect(await autoSendLogs({ url: URL, fetcher: f, now })).toBe(false); // not allowed
    await setAutoReports(true);
    expect(await autoSendLogs({ url: URL, fetcher: f, now })).toBe(false); // "before" is older than the consent
    await logEvent("ai", "after");
    await logEvent("info", "note");
    expect(await autoSendLogs({ url: URL, fetcher: f, now })).toBe(true);
    expect(bodies[0].logs.auto).toBe(true);
    expect(bodies[0].logs.entries.map((x) => x.message)).toEqual(["after"]);
    await logEvent("error", "soon after");
    expect(await autoSendLogs({ url: URL, fetcher: f, now: new Date(now.getTime() + 60_000) })).toBe(false); // 10-minute gap
    expect(await autoSendLogs({ url: URL, fetcher: f, now: new Date(now.getTime() + 11 * 60_000) })).toBe(true);
    expect(bodies[1].logs.entries.map((x) => x.message)).toEqual(["soon after"]);
    await setAutoReports(false);
    await logEvent("error", "off again");
    expect(await autoSendLogs({ url: URL, fetcher: f, now: new Date(now.getTime() + 30 * 60_000) })).toBe(false);
    expect((await getProfile()).autoErrorReports).toBe(false);
  });

  it("the button sends the journal and marks it as sent", async () => {
    const { f, bodies } = okFetch();
    expect(await sendLogsNow({ url: URL, fetcher: f })).toBe(true);
    expect(bodies[0].logs.auto).toBe(false);
    expect(bodies[0].logs.entries.at(-1)?.message).toBe("off again");
    const last = await db.logs.orderBy("id").last();
    expect((await getProfile()).logsSentId).toBe(last?.id);
  });
});
