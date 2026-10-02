import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./test/setup.ts"],
    // `tests/*.test.mjs` use Node's built-in test runner (and depend on
    // file: URLs).  Running them through Vite transforms `import.meta.url`
    // into a non-file URL, so keep the two runners separate; package.json
    // invokes these files with `node --test` after Vitest completes.
    exclude: ["**/node_modules/**", "tests/**/*.test.mjs"],
  },
});
