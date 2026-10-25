/**
 * Offline text recognition for scanned PDF pages (ADR-019). The engine
 * (tesseract.js + Russian/English LSTM models) ships inside the app under /ocr,
 * so nothing is downloaded and pages never leave the device. Loaded lazily —
 * only when a PDF actually has pages without a text layer.
 */
import type { Worker } from "tesseract.js";

/** A page with fewer letters than this in its text layer is treated as a scan. */
export const SCAN_LETTERS = 25;

export const looksScanned = (text: string) => (text.match(/\p{L}/gu) ?? []).length < SCAN_LETTERS;

export interface Ocr {
  recognize(image: HTMLCanvasElement): Promise<string>;
  close(): Promise<void>;
}

/** Rejects when `p` takes longer than `ms` — a stuck engine must never freeze the import. */
export function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const tm = setTimeout(() => reject(new Error(`${what} timed out after ${Math.round(ms / 1000)} s`)), ms);
    p.then(
      (v) => {
        clearTimeout(tm);
        resolve(v);
      },
      (e) => {
        clearTimeout(tm);
        reject(e);
      },
    );
  });
}

export const OCR_START_MS = 60_000;
export const OCR_PAGE_MS = 90_000;

// smallest module using a SIMD instruction (same probe as wasm-feature-detect)
const SIMD_PROBE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);

/** WebAssembly SIMD — every supported WebView has it; the app ships only the SIMD engine. */
export function hasWasmSimd(): boolean {
  try {
    return typeof WebAssembly !== "undefined" && WebAssembly.validate(SIMD_PROBE);
  } catch {
    return false;
  }
}

export async function startOcr(): Promise<Ocr> {
  if (!hasWasmSimd()) throw new Error("Text recognition needs WebAssembly SIMD (update Android System WebView)");
  const { createWorker } = await import("tesseract.js");
  const base = new URL("ocr/", document.baseURI).href;
  const worker: Worker = await createWorker(["rus", "eng"], 1 /* LSTM only */, {
    workerPath: `${base}worker.min.js`,
    corePath: `${base}core/tesseract-core-simd-lstm.wasm.js`,
    langPath: `${base}lang`,
    gzip: true,
    workerBlobURL: false,
    cacheMethod: "none",
  });
  return {
    async recognize(image) {
      const { data } = await worker.recognize(image);
      return data.text ?? "";
    },
    close: () => worker.terminate().then(() => undefined),
  };
}
