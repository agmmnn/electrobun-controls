import {
  detectRuntimeOS,
  resolveControlVariant,
  type DetectRuntimeOSInput,
  type ResolveControlVariantInput,
} from "./os"
import type {
  ControlVariant,
  RuntimeOS,
  WindowControlsAdapter,
  WindowControlsSnapshot,
  WindowControlsState,
} from "./types"

export interface CreateControlsControllerOptions
  extends DetectRuntimeOSInput,
    ResolveControlVariantInput {
  adapter?: WindowControlsAdapter
  snapshot?: Partial<WindowControlsSnapshot>
}

export type ControlsControllerListener = (state: WindowControlsState) => void

export interface ControlsController {
  getState: () => WindowControlsState
  subscribe: (listener: ControlsControllerListener) => () => void
  setSnapshot: (snapshot: Partial<WindowControlsSnapshot>) => void
  close: () => Promise<void>
  minimize: () => Promise<void>
  toggleMaximize: () => Promise<void>
  toggleFullscreen: () => Promise<void>
  destroy: () => void
}

function getDefaultSnapshot(): WindowControlsSnapshot {
  return {
    maximized: false,
    focused: typeof document === "undefined" ? true : document.hasFocus(),
  }
}

function cloneState(state: WindowControlsState): WindowControlsState {
  return {
    os: state.os,
    variant: state.variant,
    snapshot: { ...state.snapshot },
  }
}

function runAdapterMethod(method?: () => void | Promise<void>): Promise<void> {
  if (!method) return Promise.resolve()
  return Promise.resolve(method())
}

export function createControlsController(
  options: CreateControlsControllerOptions = {}
): ControlsController {
  const os: RuntimeOS = detectRuntimeOS({ os: options.os })
  const variant: ControlVariant = resolveControlVariant({
    os,
    variant: options.variant,
  })
  let state: WindowControlsState = {
    os,
    variant,
    snapshot: {
      ...getDefaultSnapshot(),
      ...options.snapshot,
    },
  }

  const listeners = new Set<ControlsControllerListener>()
  const unsubscribers = new Set<() => void>()
  const adapter = options.adapter
  let destroyed = false

  const notify = () => {
    const next = cloneState(state)
    for (const listener of listeners) {
      listener(next)
    }
  }

  const setSnapshot = (patch: Partial<WindowControlsSnapshot>) => {
    if (destroyed) return
    state = {
      ...state,
      snapshot: {
        ...state.snapshot,
        ...patch,
      },
    }
    notify()
  }

  if (typeof window !== "undefined") {
    const onFocus = () => setSnapshot({ focused: true })
    const onBlur = () => setSnapshot({ focused: false })
    window.addEventListener("focus", onFocus)
    window.addEventListener("blur", onBlur)
    unsubscribers.add(() => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("blur", onBlur)
    })
  }

  if (adapter?.getSnapshot) {
    Promise.resolve(adapter.getSnapshot())
      .then((snapshot) => {
        if (snapshot) setSnapshot(snapshot)
      })
      .catch(() => {})
  }

  if (adapter?.subscribe) {
    Promise.resolve(adapter.subscribe(setSnapshot))
      .then((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribers.add(unsubscribe)
        }
      })
      .catch(() => {})
  }

  const close = () => runAdapterMethod(adapter?.close)
  const minimize = () => runAdapterMethod(adapter?.minimize)

  const toggleMaximize = async () => {
    const previous = state.snapshot.maximized
    setSnapshot({ maximized: !previous })

    try {
      await runAdapterMethod(adapter?.toggleMaximize)
    } catch (error) {
      setSnapshot({ maximized: previous })
      throw error
    }
  }

  const toggleFullscreen = async () => {
    if (adapter?.toggleFullscreen) {
      await runAdapterMethod(adapter.toggleFullscreen)
      return
    }

    await toggleMaximize()
  }

  return {
    getState: () => cloneState(state),
    subscribe(listener) {
      listeners.add(listener)
      listener(cloneState(state))
      return () => {
        listeners.delete(listener)
      }
    },
    setSnapshot,
    close,
    minimize,
    toggleMaximize,
    toggleFullscreen,
    destroy() {
      if (destroyed) return
      destroyed = true
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
      unsubscribers.clear()
      listeners.clear()
    },
  }
}
