import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "playground",
  resolve: {
    alias: [
      {
        find: "electrobun-controls/dom",
        replacement: resolve(__dirname, "src/dom.ts"),
      },
      {
        find: "electrobun-controls/electrobun",
        replacement: resolve(__dirname, "src/electrobun.ts"),
      },
      {
        find: "electrobun-controls/bun",
        replacement: resolve(__dirname, "src/bun.ts"),
      },
      {
        find: "electrobun-controls/style.css",
        replacement: resolve(__dirname, "src/style.css"),
      },
      {
        find: "electrobun-controls",
        replacement: resolve(__dirname, "src/index.ts"),
      },
    ],
  },
});
