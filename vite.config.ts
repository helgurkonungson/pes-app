import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_REPO__: JSON.stringify("helgurkonungson/pes-app"),
  },
  build: {
    target: "es2022",
    outDir: "dist",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Android's WebView asset server may not know the .mjs MIME type; ship pdf.js' worker as .js
        assetFileNames: (info) => (info.names?.[0]?.endsWith(".mjs") ? "assets/[name]-[hash].js" : "assets/[name]-[hash][extname]"),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
