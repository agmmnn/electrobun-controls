<div align="center">
<img width="200" alt="electrobun-controls" src="https://github.com/user-attachments/assets/cb37ac12-543e-44b1-afda-7313256d9757" />

# electrobun-controls

</div>

Framework-agnostic, native-looking window controls for Electrobun.

> One package. No boilerplate. Works with any frontend.

## ✨ Features

- native-style window controls (macOS, Windows, Linux)
- framework-agnostic DOM API (React, Vue, Svelte, Solid, vanilla)
- built-in Electrobun adapter (auto RPC wiring)
- Bun helper for native window actions
- prebuilt renderer + styles
- titlebar utilities with correct drag regions

## 📦 Install

```bash
npm install electrobun-controls
```

If using Electrobun, install it in your host app as well:

```bash
npm install electrobun
```

## ⚡ Quick start

### 1. Electrobun (main process)

```ts
import { BrowserWindow } from "electrobun/bun";
import { createElectrobunWindowControlsRPC } from "electrobun-controls/bun";

let mainWindow: BrowserWindow;

mainWindow = new BrowserWindow({
  title: "My App",
  url: "views://mainview/index.html",
  titleBarStyle: "hidden",
  rpc: createElectrobunWindowControlsRPC(() => mainWindow),
});
```

### 2. Renderer

```ts
import "electrobun-controls/style.css";
import { createTitlebar } from "electrobun-controls/dom";
import { createElectrobunAdapter } from "electrobun-controls/electrobun";

const titlebar = createTitlebar({
  adapter: createElectrobunAdapter(),
  title: "My App",
});

document.body.prepend(titlebar.element);
```

## 🧩 Framework usage

Mount into any framework via a ref or host element:

```ts
import "electrobun-controls/style.css";
import { mountWindowControls } from "electrobun-controls/dom";
import { createElectrobunAdapter } from "electrobun-controls/electrobun";

const mounted = mountWindowControls(hostElement, {
  adapter: createElectrobunAdapter(),
});

// cleanup
mounted.destroy();
```

## How it works

- main process exposes window actions via RPC
- renderer adapter connects automatically (no boilerplate)
- DOM renderer handles UI + interaction
- drag regions are applied via Electrobun classes

## Exports

- `electrobun-controls`
- `electrobun-controls/dom`
- `electrobun-controls/electrobun`
- `electrobun-controls/bun`
- `electrobun-controls/style.css`

## Notes

- OS detection: override → `process.platform` → `navigator`
- Linux uses Ubuntu/Yaru-style controls (v1)
- Electrobun adapter auto-detects webview and sets up RPC
- Bun helper maps to native window APIs (`close`, `minimize`, `maximize`, `setFullScreen`)

## Development

```bash
npm install
npm run dev
npm run build
npm run test
```

## License

MIT
