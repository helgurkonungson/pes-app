import { describe, expect, it } from "vitest";
import { hasWasmSimd, looksScanned, withTimeout } from "./ocr";

describe("offline OCR helpers", () => {
  it("detects WebAssembly SIMD (the only engine build shipped)", () => {
    expect(hasWasmSimd()).toBe(true); // Node 22, like every supported WebView
  });
  it("treats pages with almost no letters as scans", () => {
    expect(looksScanned("  12  ")).toBe(true);
    expect(looksScanned("Руководство данными определяет права принятия решений")).toBe(false);
  });
  it("gives up on a stuck step", async () => {
    await expect(withTimeout(new Promise(() => undefined), 20, "OCR")).rejects.toThrow(/timed out/);
  });
});
