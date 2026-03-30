# electrobun-controls

Framework-agnostic native-looking window controls for Electrobun.

`electrobun-controls` ships one ESM package with:

- headless runtime and OS detection
- an Electrobun adapter built on documented `Electroview.rpc.send.*` APIs
- a prebuilt DOM renderer for vanilla JS and framework refs
- a small titlebar helper that applies Electrobun drag-region classes

## Install

```bash
npm install electrobun-controls
```

If you use the Electrobun adapter, install `electrobun` in the host app as well.

## Electrobun setup

Use a custom title bar in Electrobun:

```ts
import { BrowserWindow } from "electrobun/bun"

new BrowserWindow({
  title: "My App",
  url: "views://mainview/index.html",
  titleBarStyle: "hidden",
})
```

The package uses the documented drag-region classes:

- `electrobun-webkit-app-region-drag`
- `electrobun-webkit-app-region-no-drag`

## Usage

### Vanilla / imperative DOM

```ts
import "electrobun-controls/style.css"
import { createTitlebar } from "electrobun-controls/dom"
import { createElectrobunAdapter } from "electrobun-controls/electrobun"

const titlebar = createTitlebar({
  adapter: createElectrobunAdapter(),
  title: "My App",
})

document.body.prepend(titlebar.element)
```

### Frameworks

The DOM API is framework-agnostic. Mount it into a ref or host element from React, Vue, Svelte, Solid, or plain JS:

```ts
import "electrobun-controls/style.css"
import { mountWindowControls } from "electrobun-controls/dom"
import { createElectrobunAdapter } from "electrobun-controls/electrobun"

const mounted = mountWindowControls(hostElement, {
  adapter: createElectrobunAdapter(),
})

// later
mounted.destroy()
```

## Package exports

- `electrobun-controls`
- `electrobun-controls/dom`
- `electrobun-controls/electrobun`
- `electrobun-controls/style.css`

## Notes

- Runtime OS detection uses explicit override first, then `process.platform`, then browser `navigator` signals.
- Linux maps to the Ubuntu/Yaru-inspired control variant in v1.
- The default Electrobun adapter keeps maximize state optimistically because current documented view-side APIs do not expose a richer window-state subscription surface.

## Development

```bash
npm install
npm run test
npm run build
npm run dev
```
