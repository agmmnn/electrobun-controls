import { BrowserView } from "electrobun/bun"

import type { WindowControlsSnapshot } from "../core/types"
import type {
  ElectrobunWindowControlsRPC,
  ElectrobunWindowControlsRpcSchema,
} from "../electrobun/rpc"

export interface ElectrobunControllableWindow {
  close: () => unknown
  minimize: () => unknown
  maximize: () => unknown
  unmaximize: () => unknown
  isMaximized: () => boolean
  setFullScreen: (fullScreen: boolean) => unknown
  isFullScreen: () => boolean
}

export interface CreateElectrobunWindowControlsRPCOptions<
  TWindow extends ElectrobunControllableWindow = ElectrobunControllableWindow,
> {
  getWindow: () => TWindow | null | undefined
  getSnapshot?: (
    window: TWindow
  ) => Partial<WindowControlsSnapshot> | undefined
}

function resolveWindow<TWindow extends ElectrobunControllableWindow>(
  getWindow: () => TWindow | null | undefined
): TWindow {
  const window = getWindow()
  if (!window) {
    throw new Error("Electrobun window controls RPC could not resolve a window.")
  }
  return window
}

export function createElectrobunWindowControlsRPC<
  TWindow extends ElectrobunControllableWindow = ElectrobunControllableWindow,
>(
  input:
    | CreateElectrobunWindowControlsRPCOptions<TWindow>
    | (() => TWindow | null | undefined)
): ElectrobunWindowControlsRPC {
  const options =
    typeof input === "function"
      ? { getWindow: input }
      : input

  return BrowserView.defineRPC<ElectrobunWindowControlsRpcSchema>({
    handlers: {
      requests: {
        closeWindow() {
          resolveWindow(options.getWindow).close()
        },
        minimizeWindow() {
          resolveWindow(options.getWindow).minimize()
        },
        toggleMaximizeWindow() {
          const window = resolveWindow(options.getWindow)
          const maximized = window.isMaximized()

          if (maximized) {
            window.unmaximize()
          } else {
            window.maximize()
          }

          return { maximized: !maximized }
        },
        toggleFullscreenWindow() {
          const window = resolveWindow(options.getWindow)
          const fullscreen = window.isFullScreen()
          window.setFullScreen(!fullscreen)
          return { fullscreen: !fullscreen }
        },
        getWindowState() {
          const window = resolveWindow(options.getWindow)
          return {
            maximized: window.isMaximized(),
            focused: true,
            ...options.getSnapshot?.(window),
          }
        },
      },
      messages: {},
    },
  }) as ElectrobunWindowControlsRPC
}
