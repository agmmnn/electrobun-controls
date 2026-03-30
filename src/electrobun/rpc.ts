import type { WindowControlsSnapshot } from "../core/types"

export interface ElectrobunWindowControlsRpcSchema {
  bun: {
    requests: {
      closeWindow: {
        params: undefined
        response: void
      }
      minimizeWindow: {
        params: undefined
        response: void
      }
      toggleMaximizeWindow: {
        params: undefined
        response: {
          maximized: boolean
        }
      }
      toggleFullscreenWindow: {
        params: undefined
        response: {
          fullscreen: boolean
        }
      }
      getWindowState: {
        params: undefined
        response: WindowControlsSnapshot
      }
    }
    messages: {}
  }
  webview: {
    requests: {}
    messages: {}
  }
}

export interface ElectrobunWindowControlsRPC {
  proxy: {
    request: {
      closeWindow: (params?: undefined) => Promise<unknown>
      minimizeWindow: (params?: undefined) => Promise<unknown>
      toggleMaximizeWindow: (params?: undefined) => Promise<unknown>
      toggleFullscreenWindow: (params?: undefined) => Promise<unknown>
      getWindowState: (
        params?: undefined
      ) => Promise<Partial<WindowControlsSnapshot>>
    }
  }
}
