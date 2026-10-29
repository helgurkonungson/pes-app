import { beforeEach, describe, expect, it } from "vitest";
import { authUrl, beginOpenRouterSignIn, challengeFor, clearPending, finishOpenRouterSignIn, loadPending, OAuthError, OPENROUTER_KEYS, parseCallback, PENDING_TTL_MS } from "./openrouterOAuth";

describe("OpenRouter OAuth (PKCE)", () => {
  beforeEach(() => clearPending());

  it("makes the RFC 7636 S256 challenge", async () => {
    expect(await challengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("builds the sign-in URL with our callback and state", () => {
    const u = new URL(authUrl({ challenge: "abc", state: "s1" }));
    expect(u.origin + u.pathname).toBe("https://openrouter.ai/auth");
    expect(u.searchParams.get("callback_url")).toBe("https://chompbook.online/oauth/openrouter/?state=s1&app=online.chompbook.app"); // the callback page opens this app
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("key_label")).toBe("Chompbook");
  });

  it("reads the deep link and the web callback, ignores other links", () => {
    expect(parseCallback("online.chompbook.app://oauth/openrouter?code=C&state=S")).toEqual({ code: "C", state: "S", error: undefined });
    expect(parseCallback("https://chompbook.online/oauth/openrouter/?state=S&code=C")).toMatchObject({ code: "C", state: "S" });
    expect(parseCallback("online.chompbook.app://other?code=C")).toBeNull();
    expect(parseCallback("https://example.com/?code=C")).toBeNull();
    expect(parseCallback("not a url")).toBeNull();
  });

  it("swaps the code for a key with the remembered verifier", async () => {
    const url = new URL(await beginOpenRouterSignIn(1000));
    const state = new URL(url.searchParams.get("callback_url") as string).searchParams.get("state");
    const pending = loadPending(1000);
    expect(pending?.state).toBe(state);
    let sent: unknown;
    const key = await finishOpenRouterSignIn({ code: "C", state: state as string }, async (u, body) => {
      expect(u).toBe(OPENROUTER_KEYS);
      sent = body;
      return { status: 200, data: { key: "sk-or-v1-0123456789abcdef" } };
    }, 2000);
    expect(key).toBe("sk-or-v1-0123456789abcdef");
    expect(sent).toEqual({ code: "C", code_verifier: pending?.verifier, code_challenge_method: "S256" });
    expect(await challengeFor(pending?.verifier as string)).toBe(url.searchParams.get("code_challenge"));
    expect(loadPending(2000)).toBeNull();
  });

  it("refuses a wrong state, an old sign-in, a cancelled one and a used code", async () => {
    const post = async () => ({ status: 200, data: { key: "sk-or-v1-0123456789abcdef" } });
    const fails = async (p: Promise<unknown>, kind: string) => {
      const e = await p.catch((x: unknown) => x);
      expect(e).toBeInstanceOf(OAuthError);
      expect((e as OAuthError).kind).toBe(kind);
    };
    await beginOpenRouterSignIn(0);
    await fails(finishOpenRouterSignIn({ code: "C", state: "other" }, post, 1), "state");
    await fails(finishOpenRouterSignIn({ code: "C", state: loadPending(0)?.state }, post, PENDING_TTL_MS + 1), "expired");
    await fails(finishOpenRouterSignIn({ error: "access_denied" }, post, 1), "denied");
    const s = loadPending(0)?.state;
    await fails(finishOpenRouterSignIn({ code: "C", state: s }, async () => ({ status: 403, data: { error: "invalid code" } }), 1), "expired");
    await beginOpenRouterSignIn(0);
    await fails(finishOpenRouterSignIn({ code: "C", state: loadPending(0)?.state }, async () => { throw new Error("offline"); }, 1), "network");
  });
});
