import { describe, expect, it } from "vitest";
import { AiError } from "./client";
import { classifySetupError, createGeminiKey, GeminiSetupError, geminiKeyIn, type Http, isRegionBlocked } from "./geminiSetup";

const KEY = "AIzaSyD-0123456789abcdefghijklmnopqrstu";

/** A fake Google: records calls, answers by URL. */
function google(opts: { existingProject?: boolean; existingKey?: boolean; createError?: { status: number; data: unknown } } = {}) {
  const calls: string[] = [];
  let polls = 0;
  const http: Http = async (url, o) => {
    calls.push(`${o.method} ${url.replace(/\?.*/, "")}`);
    expect(o.headers.authorization).toBe("Bearer tok");
    if (url.includes("/v1/projects?filter")) return { status: 200, data: opts.existingProject ? { projects: [{ projectId: "chompbook-old", lifecycleState: "ACTIVE" }] } : {} };
    if (url.endsWith("/v1/projects") && o.method === "POST") return opts.createError ?? { status: 200, data: { name: "operations/cp.1", done: false } };
    if (url.includes("/v1/operations/cp.1")) return { status: 200, data: { name: "operations/cp.1", done: ++polls > 1 } };
    if (url.includes(":enable")) return { status: 200, data: { name: "operations/acf.2", done: true } };
    if (url.endsWith("/locations/global/keys") && o.method === "GET") return { status: 200, data: opts.existingKey ? { keys: [{ name: "projects/1/locations/global/keys/k0", displayName: "Chompbook" }] } : { keys: [] } };
    if (url.endsWith("/locations/global/keys") && o.method === "POST") return { status: 200, data: { name: "operations/akmf.3", done: false } };
    if (url.includes("operations/akmf.3")) return { status: 200, data: { name: "operations/akmf.3", done: true, response: { name: "projects/1/locations/global/keys/k1" } } };
    if (url.endsWith("/keyString")) return { status: 200, data: { keyString: KEY } };
    return { status: 404, data: { error: { message: `unexpected ${url}` } } };
  };
  return { http, calls };
}

const fast = { sleep: async () => undefined, random: () => "abc123" };

describe("Gemini key setup", () => {
  it("creates project → enables the API → creates a restricted key → checks it", async () => {
    const g = google();
    const steps: string[] = [];
    let tests = 0;
    const r = await createGeminiKey("tok", { ...fast, http: g.http, onStep: (s) => steps.push(s), testKey: async () => { if (++tests < 2) throw new AiError("not yet", "auth"); } });
    expect(r).toEqual({ key: KEY, projectId: "chompbook-abc123" });
    expect(steps).toEqual(["project", "api", "key", "check"]);
    expect(g.calls).toContain("POST https://cloudresourcemanager.googleapis.com/v1/projects");
    expect(g.calls).toContain("POST https://serviceusage.googleapis.com/v1/projects/chompbook-abc123/services/generativelanguage.googleapis.com:enable");
    expect(tests).toBe(2); // a new key is retried until Gemini accepts it
  });
  it("reuses the project and key it made before", async () => {
    const g = google({ existingProject: true, existingKey: true });
    const r = await createGeminiKey("tok", { ...fast, http: g.http, testKey: async () => undefined });
    expect(r.projectId).toBe("chompbook-old");
    expect(g.calls.some((c) => c.startsWith("POST https://cloudresourcemanager"))).toBe(false);
    expect(g.calls.some((c) => c === "POST https://apikeys.googleapis.com/v2/projects/chompbook-old/locations/global/keys")).toBe(false);
  });
  it("explains what went wrong", async () => {
    const g = google({ createError: { status: 400, data: { error: { message: "Callers must accept Terms of Service", status: "FAILED_PRECONDITION" } } } });
    await expect(createGeminiKey("tok", { ...fast, http: g.http, testKey: async () => undefined })).rejects.toMatchObject({ reason: "terms" });
    expect(classifySetupError(403, { error: { message: "Cloud Resource Manager API has not been used in project 123 before or it is disabled" } }).reason).toBe("config");
    expect(classifySetupError(429, {}).reason).toBe("quota");
    expect(classifySetupError(403, { error: { message: "The caller does not have permission" } }).reason).toBe("denied");
    expect(classifySetupError(500, {})).toBeInstanceOf(GeminiSetupError);
  });
  it("stops at once when Gemini isn't offered in the learner's country", async () => {
    const g = google({ existingProject: true, existingKey: true });
    let tests = 0;
    const blocked = new AiError("AI request failed (400): User location is not supported for the API use.", "api", 400, "User location is not supported for the API use.");
    await expect(createGeminiKey("tok", { ...fast, http: g.http, testKey: async () => { tests++; throw blocked; } })).rejects.toMatchObject({ reason: "region" });
    expect(tests).toBe(1); // no minute of retries
    expect(isRegionBlocked(blocked)).toBe(true);
    expect(isRegionBlocked(new AiError("Invalid key", "auth", 400))).toBe(false);
    expect(classifySetupError(400, { error: { message: "User location is not supported for the API use.", status: "FAILED_PRECONDITION" } }).reason).toBe("region");
  });
  it("finds a Gemini key in copied text", () => {
    expect(geminiKeyIn(`key: ${KEY} `)).toBe(KEY);
    expect(geminiKeyIn("sk-ant-123")).toBeNull();
    expect(geminiKeyIn(null)).toBeNull();
  });
});
