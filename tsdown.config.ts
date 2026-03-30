import { defineConfig } from "tsdown"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    dom: "src/dom.ts",
    electrobun: "src/electrobun.ts",
    bun: "src/bun.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  platform: "browser",
  external: ["electrobun/view", "electrobun/bun"],
})
