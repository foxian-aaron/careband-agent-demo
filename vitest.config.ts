import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    exclude: ["backend/**", "node_modules/**", "dist/**"],
  },
});
