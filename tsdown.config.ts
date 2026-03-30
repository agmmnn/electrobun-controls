import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    dom: "src/dom.ts",
    electrobun: "src/electrobun.ts",
    bun: "src/bun.ts",
  },
  deps: {
    neverBundle: ["electrobun/view", "electrobun/bun"],
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  platform: "browser",
});
