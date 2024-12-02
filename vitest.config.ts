import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "dist/**"],
    },
    testTimeout: 30000, // 30 seconds for API calls
    include: ["tests/**/*.test.ts"], // Only include .test.ts files
    exclude: ["tests/**/*.spec.ts"], // Explicitly exclude spec files
    retry: 2, // Retry failed tests twice
    maxConcurrency: 1, // Run tests serially to avoid API rate limits
  },
});
