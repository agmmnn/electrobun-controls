import { afterEach, describe, expect, it, vi } from "vitest";
import { detectRuntimeOS, resolveControlVariant } from "../src/index";

const originalNavigator = globalThis.navigator;

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: originalNavigator,
  });
});

describe("detectRuntimeOS", () => {
  it("prefers an explicit override", () => {
    expect(detectRuntimeOS({ os: "linux" })).toBe("linux");
  });

  it("uses process.platform when available", () => {
    const processStub = { platform: "darwin" };
    vi.stubGlobal("process", processStub);

    expect(detectRuntimeOS()).toBe("macos");
  });

  it("falls back to navigator detection", () => {
    vi.stubGlobal("process", { platform: "unknown" });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    expect(detectRuntimeOS()).toBe("windows");
  });
});

describe("resolveControlVariant", () => {
  it("maps linux to ubuntu controls", () => {
    expect(resolveControlVariant({ os: "linux" })).toBe("ubuntu");
  });

  it("respects explicit variant overrides", () => {
    expect(
      resolveControlVariant({
        os: "windows",
        variant: "macos",
      }),
    ).toBe("macos");
  });
});
