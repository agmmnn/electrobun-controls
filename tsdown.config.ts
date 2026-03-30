import { defineConfig } from "tsdown"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    dom: "src/dom.ts",
    electrobun: "src/electrobun.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  platform: "browser",
})
