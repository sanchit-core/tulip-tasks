import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Compiles `.svelte.ts` runes modules (the store) and resolves the `$lib`
// alias from SvelteKit so tests import the app exactly like runtime code does.
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./src/lib/__tests__/setup.mjs"],
  },
});
