import { beforeEach, describe, expect, it, vi } from "vitest"

const postMessage = vi.fn()

const decodeRequestMethod = (payload: unknown) => {
  const frames = JSON.parse(String(payload)) as string[]
  const packet = JSON.parse(frames[0] ?? "{}") as { method?: string }
  return packet.method
}

describe("createElectrobunAdapter", () => {
  beforeEach(() => {
    postMessage.mockReset()
    Object.assign(window, {
      __electrobunInternalBridge: { postMessage },
      __electrobunWindowId: 7,
      __electrobunWebviewId: 3,
    })
  })

  it("forwards close/minimize/maximize actions to Electrobun's internal bridge", async () => {
    const { createElectrobunAdapter } = await import("../src/electrobun")
    const adapter = createElectrobunAdapter()

    await adapter.close()
    await adapter.minimize()
    await adapter.toggleMaximize()

    expect(postMessage).toHaveBeenCalledTimes(3)
    expect(decodeRequestMethod(postMessage.mock.calls[0]?.[0])).toBe("closeWindow")
    expect(decodeRequestMethod(postMessage.mock.calls[1]?.[0])).toBe("minimizeWindow")
    expect(decodeRequestMethod(postMessage.mock.calls[2]?.[0])).toBe("maximizeWindow")
  })
})
