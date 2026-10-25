/**
 * Copies the offline OCR engine (tesseract.js worker, wasm core, rus+eng models)
 * into public/ocr so it ships inside the APK — OCR never needs the network.
 * Called from vite.config.ts on every dev/build start; public/ocr is gitignored.
 */
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = (p) => join(root, "node_modules", p);

export const OCR_FILES = [
  [nm("tesseract.js/dist/worker.min.js"), "worker.min.js"],
  // only the LSTM engine, SIMD build: every supported WebView (Chrome 94+, Safari 16.4+) has
  // WebAssembly SIMD, so the plain build (another 3.9 MB in the APK) is not shipped (0.13.0)
  [nm("tesseract.js-core/tesseract-core-simd-lstm.wasm.js"), "core/tesseract-core-simd-lstm.wasm.js"],
  [nm("@tesseract.js-data/rus/4.0.0_best_int/rus.traineddata.gz"), "lang/rus.traineddata.gz"],
  [nm("@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz"), "lang/eng.traineddata.gz"],
];

/** Files older versions copied that must not ship any more. */
const DROPPED = ["core/tesseract-core-lstm.wasm.js"];

export function copyOcrAssets(out = join(root, "public", "ocr")) {
  for (const f of DROPPED) rmSync(join(out, f), { force: true });
  for (const [from, to] of OCR_FILES) {
    const dest = join(out, to);
    if (existsSync(dest) && statSync(dest).size === statSync(from).size) continue;
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(from, dest);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) copyOcrAssets();
