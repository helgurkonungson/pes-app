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

export async function startOcr(): Promise<Ocr> {
  const [{ createWorker }, { simd }] = await Promise.all([import("tesseract.js"), import("wasm-feature-detect")]);
  const base = new URL("ocr/", document.baseURI).href;
  const core = (await simd()) ? "tesseract-core-simd-lstm.wasm.js" : "tesseract-core-lstm.wasm.js";
  const worker: Worker = await createWorker(["rus", "eng"], 1 /* LSTM only */, {
    workerPath: `${base}worker.min.js`,
    corePath: `${base}core/${core}`,
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
