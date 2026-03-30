import type {
  WindowControlsAdapter,
  WindowControlsListener,
  WindowControlsSnapshot,
} from "../core/types"

export interface CreateElectrobunAdapterOptions {
  snapshot?: Partial<WindowControlsSnapshot>
}

export function createElectrobunAdapter(
  options: CreateElectrobunAdapterOptions = {}
): WindowControlsAdapter {
  let snapshot: WindowControlsSnapshot = {
    maximized: false,
    focused: typeof document === "undefined" ? true : document.hasFocus(),
    ...options.snapshot,
  }
  const listeners = new Set<WindowControlsListener>()
  let subscriptions = 0
  let requestId = 0

  const emit = () => {
    const next = { ...snapshot }
    for (const listener of listeners) {
      listener(next)
    }
  }

  const setSnapshot = (patch: Partial<WindowControlsSnapshot>) => {
    snapshot = {
      ...snapshot,
      ...patch,
    }
    emit()
  }

  const onFocus = () => setSnapshot({ focused: true })
  const onBlur = () => setSnapshot({ focused: false })

  const bindFocus = () => {
    if (subscriptions !== 1 || typeof window === "undefined") return
    window.addEventListener("focus", onFocus)
    window.addEventListener("blur", onBlur)
  }

  const unbindFocus = () => {
    if (subscriptions !== 0 || typeof window === "undefined") return
    window.removeEventListener("focus", onFocus)
    window.removeEventListener("blur", onBlur)
  }

  const sendInternalRequest = (method: string, params: unknown) => {
    if (typeof window === "undefined" || !window.__electrobunInternalBridge) {
      return Promise.resolve()
    }

    requestId += 1

    const payload = JSON.stringify([
      JSON.stringify({
        type: "request",
        method,
        id: `electrobun-controls-${requestId}`,
        params,
        hostWebviewId: window.__electrobunWebviewId,
      }),
    ])

    window.__electrobunInternalBridge.postMessage(payload)
    return Promise.resolve()
  }

  const getWindowParams = (extra: Record<string, unknown> = {}) => ({
    winId: window.__electrobunWindowId,
    ...extra,
  })

  return {
    close() {
      return sendInternalRequest("closeWindow", getWindowParams())
    },
    minimize() {
      return sendInternalRequest("minimizeWindow", getWindowParams())
    },
    async toggleMaximize() {
      const nextMaximized = !snapshot.maximized
      await sendInternalRequest(
        nextMaximized ? "maximizeWindow" : "unmaximizeWindow",
        getWindowParams()
      )
      setSnapshot({ maximized: nextMaximized })
    },
    getSnapshot() {
      return { ...snapshot }
    },
    subscribe(listener) {
      listeners.add(listener)
      subscriptions += 1
      bindFocus()
      listener({ ...snapshot })

      return () => {
        listeners.delete(listener)
        subscriptions = Math.max(0, subscriptions - 1)
        unbindFocus()
      }
    },
  }
}
