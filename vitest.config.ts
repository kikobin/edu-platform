import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    // Exclude Next.js app directory from test discovery
    exclude: ["node_modules", ".next", "src/app/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` is a virtual marker provided by Next.js. It exists only
      // to break the build when imported from a client component. In vitest
      // (which has no Next runtime) we redirect it to an empty shim so files
      // that import it can still be exercised by unit tests.
      "server-only": path.resolve(__dirname, "./src/__tests__/server-only-shim.ts"),
    },
  },
});
