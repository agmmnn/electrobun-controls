import { Electroview } from "electrobun/view";

import type {
  WindowControlsAdapter,
  WindowControlsListener,
  WindowControlsSnapshot,
} from "../core/types";
import type {
  ElectrobunWindowControlsRPC,
  ElectrobunWindowControlsRpcSchema,
} from "./rpc";

export interface CreateElectrobunAdapterOptions {
  snapshot?: Partial<WindowControlsSnapshot>;
  rpc?: ElectrobunWindowControlsRPC;
}

let defaultElectroview: InstanceType<typeof Electroview> | undefined;
let defaultRPC: ElectrobunWindowControlsRPC | undefined;

function getDefaultElectrobunRPC() {
  if (
    typeof window === "undefined" ||
    typeof window.__electrobunWebviewId !== "number"
  ) {
    return undefined;
  }

  if (!defaultRPC) {
    defaultRPC = Electroview.defineRPC<ElectrobunWindowControlsRpcSchema>({
      handlers: {
        requests: {},
        messages: {},
      },
    }) as ElectrobunWindowControlsRPC;
  }

  if (!defaultElectroview) {
    defaultElectroview = new Electroview({ rpc: defaultRPC });
  }

  return defaultRPC;
}

export function createElectrobunAdapter(
  options: CreateElectrobunAdapterOptions = {},
): WindowControlsAdapter {
  let snapshot: WindowControlsSnapshot = {
    maximized: false,
    focused: typeof document === "undefined" ? true : document.hasFocus(),
    ...options.snapshot,
  };
  const listeners = new Set<WindowControlsListener>();
  let subscriptions = 0;
  let requestId = 0;

  const emit = () => {
    const next = { ...snapshot };
    for (const listener of listeners) {
      listener(next);
    }
  };

  const setSnapshot = (patch: Partial<WindowControlsSnapshot>) => {
    snapshot = {
      ...snapshot,
      ...patch,
    };
    emit();
  };

  const onFocus = () => setSnapshot({ focused: true });
  const onBlur = () => setSnapshot({ focused: false });

  const bindFocus = () => {
    if (subscriptions !== 1 || typeof window === "undefined") return;
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
  };

  const unbindFocus = () => {
    if (subscriptions !== 0 || typeof window === "undefined") return;
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("blur", onBlur);
  };

  const sendInternalRequest = (method: string, params: unknown) => {
    if (typeof window === "undefined" || !window.__electrobunInternalBridge) {
      return Promise.resolve();
    }

    requestId += 1;

    const payload = JSON.stringify([
      JSON.stringify({
        type: "request",
        method,
        id: `electrobun-controls-${requestId}`,
        params,
        hostWebviewId: window.__electrobunWebviewId,
      }),
    ]);

    window.__electrobunInternalBridge.postMessage(payload);
    return Promise.resolve();
  };

  const getWindowParams = (extra: Record<string, unknown> = {}) => ({
    winId: window.__electrobunWindowId,
    ...extra,
  });
  const getRPC = () => options.rpc ?? getDefaultElectrobunRPC();

  const adapter: WindowControlsAdapter = {
    close() {
      const rpc = getRPC();
      if (rpc) {
        return rpc.proxy.request.closeWindow();
      }
      return sendInternalRequest("closeWindow", getWindowParams());
    },
    minimize() {
      const rpc = getRPC();
      if (rpc) {
        return rpc.proxy.request.minimizeWindow();
      }
      return sendInternalRequest("minimizeWindow", getWindowParams());
    },
    async toggleMaximize() {
      const nextMaximized = !snapshot.maximized;
      const rpc = getRPC();
      if (rpc) {
        await rpc.proxy.request.toggleMaximizeWindow();
      } else {
        await sendInternalRequest(
          nextMaximized ? "maximizeWindow" : "unmaximizeWindow",
          getWindowParams(),
        );
      }
      setSnapshot({ maximized: nextMaximized });
    },
    async getSnapshot() {
      const rpc = getRPC();
      if (rpc?.proxy.request.getWindowState) {
        snapshot = {
          ...snapshot,
          ...(await rpc.proxy.request.getWindowState()),
        };
      }
      return { ...snapshot };
    },
    subscribe(listener) {
      listeners.add(listener);
      subscriptions += 1;
      bindFocus();
      listener({ ...snapshot });

      return () => {
        listeners.delete(listener);
        subscriptions = Math.max(0, subscriptions - 1);
        unbindFocus();
      };
    },
  };

  if (options.rpc ?? getDefaultElectrobunRPC()) {
    adapter.toggleFullscreen = async () => {
      const rpc = getRPC();
      await rpc?.proxy.request.toggleFullscreenWindow();
    };
  }

  return adapter;
}
