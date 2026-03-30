import { describe, expect, it, vi } from "vitest"

const defineRPC = vi.fn()

vi.mock("electrobun/bun", () => ({
  BrowserView: {
    defineRPC,
  },
}))

describe("createElectrobunWindowControlsRPC", () => {
  it("creates request handlers for close, minimize, maximize, fullscreen, and state", async () => {
    const window = {
      close: vi.fn(),
      minimize: vi.fn(),
      maximize: vi.fn(),
      unmaximize: vi.fn(),
      isMaximized: vi.fn().mockReturnValue(false),
      setFullScreen: vi.fn(),
      isFullScreen: vi.fn().mockReturnValue(false),
    }

    defineRPC.mockImplementation((config) => config)

    const { createElectrobunWindowControlsRPC } = await import("../src/bun")
    const rpc = createElectrobunWindowControlsRPC({
      getWindow: () => window,
      getSnapshot: () => ({
        focused: false,
      }),
    }) as {
      handlers: {
        requests: {
          closeWindow: () => void
          minimizeWindow: () => void
          toggleMaximizeWindow: () => { maximized: boolean }
          toggleFullscreenWindow: () => { fullscreen: boolean }
          getWindowState: () => { maximized: boolean; focused: boolean }
        }
      }
    }

    rpc.handlers.requests.closeWindow()
    rpc.handlers.requests.minimizeWindow()
    expect(rpc.handlers.requests.toggleMaximizeWindow()).toEqual({
      maximized: true,
    })
    expect(rpc.handlers.requests.toggleFullscreenWindow()).toEqual({
      fullscreen: true,
    })
    expect(rpc.handlers.requests.getWindowState()).toEqual({
      maximized: false,
      focused: false,
    })

    expect(window.close).toHaveBeenCalledTimes(1)
    expect(window.minimize).toHaveBeenCalledTimes(1)
    expect(window.maximize).toHaveBeenCalledTimes(1)
    expect(window.unmaximize).not.toHaveBeenCalled()
    expect(window.setFullScreen).toHaveBeenCalledWith(true)
    expect(defineRPC).toHaveBeenCalledTimes(1)
  })
})
