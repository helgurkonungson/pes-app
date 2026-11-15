import { describe, expect, it } from "vitest";
import { freeProvider } from "./freeProviders";

describe("free AI providers", () => {
  it("find their keys in copied text", () => {
    expect(freeProvider("groq")!.keyIn(`key: gsk_${"a".repeat(52)} `)).toBe(`gsk_${"a".repeat(52)}`);
    expect(freeProvider("openrouter")!.keyIn(`sk-or-v1-${"0f".repeat(32)}`)).toBe(`sk-or-v1-${"0f".repeat(32)}`);
    expect(freeProvider("mistral")!.keyIn(" AbCdEfGhIjKlMnOpQrStUvWxYz012345 ")).toBe("AbCdEfGhIjKlMnOpQrStUvWxYz012345");
    expect(freeProvider("mistral")!.keyIn("some text with AbCdEfGhIjKlMnOpQrStUvWxYz012345")).toBeNull();
    expect(freeProvider("gemini")!.keyIn("AIzaSyD-0123456789abcdefghijklmnopqrstu")).toBe("AIzaSyD-0123456789abcdefghijklmnopqrstu");
    // AI Studio issues only "auth keys" now (2.0.1)
    const aq = "AQ.Ab8RN6L4Tr9b6lEZUKBRBWTyNw-Z3b3uK8m_x0123456789abcdef";
    expect(freeProvider("gemini")!.keyIn(`API Key ${aq} `)).toBe(aq);
  });
  it("Mistral is open from 13 (with a parent's permission), the rest from 18", () => {
    expect(freeProvider("mistral")!.minAge).toBe(13);
    expect(["gemini", "groq", "openrouter"].map((id) => freeProvider(id as never)!.minAge)).toEqual([18, 18, 18]);
  });
});
