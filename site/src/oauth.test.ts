// The OpenRouter sign-in callback page (chompbook.online/oauth/openrouter/): which app it opens.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("OpenRouter callback page", () => {
  it("the OpenRouter callback page opens the Google Play app first, the old GitHub build only as Chrome's fallback", () => {
    const page = readFileSync(join(__dirname, "..", "public", "oauth", "openrouter", "index.html"), "utf8");
    const script = page.match(/<script>([\s\S]*?)<\/script>/)![1];
    const run = (search: string, ua = "Mozilla/5.0 (Linux; Android 14) Chrome/130") => {
      let target = "";
      const el = () => ({ textContent: "", hidden: true, href: "" });
      const els: Record<string, ReturnType<typeof el>> = {};
      const document = { documentElement: {}, title: "", getElementById: (i: string) => (els[i] ??= el()) };
      const location = { search, origin: "https://chompbook.online", pathname: "/oauth/openrouter/", href: "", replace: (u: string) => (target = u) };
      new Function("window", "document", "location", "navigator", "setTimeout", script)({}, document, location, { language: "en", userAgent: ua }, () => 0);
      return target;
    };
    // OpenRouter may keep only `state` (+ `code`): the Play app is still the one opened
    const play = run("?state=S&code=C");
    expect(play).toMatch(/^intent:\/\/oauth\/openrouter\?state=S&code=C#Intent;scheme=online\.chompbook\.app;package=online\.chompbook\.app;S\.browser_fallback_url=/);
    const fallback = decodeURIComponent(play.match(/S\.browser_fallback_url=([^;]+)/)![1]);
    expect(fallback).toBe("https://chompbook.online/oauth/openrouter/?state=S&code=C&legacy=1");
    // Chrome comes back with legacy=1 only when the Play app isn't installed
    expect(run("?state=S&code=C&legacy=1")).toBe("intent://oauth/openrouter?state=S&code=C#Intent;scheme=io.github.helgurkonungson.pes;package=io.github.helgurkonungson.pes;end");
    expect(run("?state=S&app=online.chompbook.app&code=C")).toContain("package=online.chompbook.app;");
    // not Android: the custom scheme of the Play app
    expect(run("?state=S&code=C", "Mozilla/5.0 (iPhone)")).toBe("online.chompbook.app://oauth/openrouter?state=S&code=C");
  });
});
