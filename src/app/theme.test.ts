import { describe, expect, it } from "vitest";
import { resolveTheme } from "./theme";

describe("theme", () => {
  it("follows the system unless chosen", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});
