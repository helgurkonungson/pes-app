import { describe, expect, it } from "vitest";
import { AUTO_GAP_MS, autoBatch, autoDue, logPayload, maxId, newest } from "./errorLog";
import type { LogEntry } from "./types";

const e = (id: number, kind: LogEntry["kind"] = "error"): LogEntry => ({ id, at: "2026-10-29T10:00:00Z", kind, message: `m${id}`, version: "0.18.0" });

describe("error journal → developer", () => {
  it("manual sending takes the newest entries, oldest first, without local ids", () => {
    const rows = [e(3), e(1), e(2), e(4)];
    expect(newest(rows, 2).map((r) => r.id)).toEqual([3, 4]);
    const body = logPayload(newest(rows, 2), { version: "0.18.0", platform: "android", ua: "x", lang: "ru" }, false);
    expect(body.app).toBe("chompbook");
    expect(body.logs.entries[0]).not.toHaveProperty("id");
    expect(body.logs.auto).toBe(false);
  });
  it("automatic sending takes only unsent problems, never info lines", () => {
    expect(autoBatch([e(1), e(2, "info"), e(3, "ai"), e(4, "import")], 1).map((r) => r.id)).toEqual([3, 4]);
    expect(autoBatch([e(1)], 1)).toEqual([]);
    expect(autoBatch(Array.from({ length: 50 }, (_, i) => e(i + 1)), undefined, 30)).toHaveLength(30);
  });
  it("at most once every ten minutes (a clock moved back does not block it)", () => {
    const now = new Date("2026-10-29T10:00:00Z");
    expect(autoDue(undefined, now)).toBe(true);
    expect(autoDue(new Date(now.getTime() - AUTO_GAP_MS + 1000).toISOString(), now)).toBe(false);
    expect(autoDue(new Date(now.getTime() - AUTO_GAP_MS).toISOString(), now)).toBe(true);
    expect(autoDue("2027-01-01T00:00:00Z", now)).toBe(true);
  });
  it("remembers the highest sent id", () => {
    expect(maxId([e(2), e(5)], 3)).toBe(5);
    expect(maxId([], 3)).toBe(3);
    expect(maxId([e(1)], 3)).toBe(3);
  });
});
