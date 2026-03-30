import { beforeEach, describe, expect, it, vi } from "vitest";

const postMessage = vi.fn();
const defineRPC = vi.fn();
const Electroview = vi.fn();

vi.mock("electrobun/view", () => ({
  Electroview: Object.assign(Electroview, {
    defineRPC,
  }),
}));

const decodeRequestMethod = (payload: unknown) => {
  const frames = JSON.parse(String(payload)) as string[];
  const packet = JSON.parse(frames[0] ?? "{}") as { method?: string };
  return packet.method;
};

describe("createElectrobunAdapter", () => {
  beforeEach(() => {
    vi.resetModules();
    postMessage.mockReset();
    defineRPC.mockReset();
    Electroview.mockReset();
    Object.assign(window, {
      __electrobunInternalBridge: { postMessage },
      __electrobunWindowId: 7,
      __electrobunWebviewId: undefined,
      __electrobun: {
        receiveMessageFromBun: vi.fn(),
      },
    });
  });

  it("forwards close/minimize/maximize actions to Electrobun's internal bridge", async () => {
    const { createElectrobunAdapter } = await import("../src/electrobun");
    const adapter = createElectrobunAdapter();

    await adapter.close();
    await adapter.minimize();
    await adapter.toggleMaximize();

    expect(postMessage).toHaveBeenCalledTimes(3);
    expect(decodeRequestMethod(postMessage.mock.calls[0]?.[0])).toBe(
      "closeWindow",
    );
    expect(decodeRequestMethod(postMessage.mock.calls[1]?.[0])).toBe(
      "minimizeWindow",
    );
    expect(decodeRequestMethod(postMessage.mock.calls[2]?.[0])).toBe(
      "maximizeWindow",
    );
  });

  it("bootstraps Electroview RPC automatically when running inside Electrobun", async () => {
    const closeWindow = vi.fn().mockResolvedValue(undefined);
    const minimizeWindow = vi.fn().mockResolvedValue(undefined);
    const toggleMaximizeWindow = vi.fn().mockResolvedValue(undefined);
    const toggleFullscreenWindow = vi.fn().mockResolvedValue(undefined);
    const getWindowState = vi.fn().mockResolvedValue({
      maximized: false,
      focused: true,
    });

    defineRPC.mockReturnValue({
      proxy: {
        request: {
          closeWindow,
          minimizeWindow,
          toggleMaximizeWindow,
          toggleFullscreenWindow,
          getWindowState,
        },
      },
      setTransport: vi.fn(),
    });

    Object.assign(window, {
      __electrobunWebviewId: 3,
      __electrobunRpcSocketPort: 50000,
    });

    const { createElectrobunAdapter } = await import("../src/electrobun");
    const adapter = createElectrobunAdapter();

    await adapter.close();
    await adapter.minimize();
    await adapter.toggleMaximize();
    await adapter.toggleFullscreen?.();
    expect(await adapter.getSnapshot()).toEqual({
      maximized: false,
      focused: true,
    });

    expect(defineRPC).toHaveBeenCalledTimes(1);
    expect(Electroview).toHaveBeenCalledTimes(1);
    expect(closeWindow).toHaveBeenCalledTimes(1);
    expect(minimizeWindow).toHaveBeenCalledTimes(1);
    expect(toggleMaximizeWindow).toHaveBeenCalledTimes(1);
    expect(toggleFullscreenWindow).toHaveBeenCalledTimes(1);
    expect(getWindowState).toHaveBeenCalledTimes(1);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("uses a provided Electrobun RPC transport when available", async () => {
    const closeWindow = vi.fn().mockResolvedValue(undefined);
    const minimizeWindow = vi.fn().mockResolvedValue(undefined);
    const toggleMaximizeWindow = vi.fn().mockResolvedValue(undefined);
    const toggleFullscreenWindow = vi.fn().mockResolvedValue(undefined);
    const getWindowState = vi.fn().mockResolvedValue({
      maximized: true,
      focused: false,
    });

    const { createElectrobunAdapter } = await import("../src/electrobun");
    const adapter = createElectrobunAdapter({
      rpc: {
        proxy: {
          request: {
            closeWindow,
            minimizeWindow,
            toggleMaximizeWindow,
            toggleFullscreenWindow,
            getWindowState,
          },
        },
      },
    });

    await adapter.close();
    await adapter.minimize();
    await adapter.toggleMaximize();
    await adapter.toggleFullscreen?.();
    expect(await adapter.getSnapshot()).toEqual({
      maximized: true,
      focused: false,
    });

    expect(closeWindow).toHaveBeenCalledTimes(1);
    expect(minimizeWindow).toHaveBeenCalledTimes(1);
    expect(toggleMaximizeWindow).toHaveBeenCalledTimes(1);
    expect(toggleFullscreenWindow).toHaveBeenCalledTimes(1);
    expect(getWindowState).toHaveBeenCalledTimes(1);
    expect(postMessage).not.toHaveBeenCalled();
  });
});
