import { describe, expect, it, vi } from "vitest";
import {
  createTitlebar,
  DRAG_REGION_CLASS,
  mountWindowControls,
  NO_DRAG_REGION_CLASS,
} from "../src/dom";
import type { WindowControlsAdapter } from "../src";

function createAdapter(): WindowControlsAdapter {
  return {
    close: vi.fn(),
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
  };
}

describe("mountWindowControls", () => {
  it("renders windows button order and no-drag buttons", () => {
    const host = document.createElement("div");
    const mounted = mountWindowControls(host, {
      os: "windows",
      adapter: createAdapter(),
    });

    const actions = Array.from(
      mounted.element.querySelectorAll<HTMLButtonElement>("[data-action]"),
    ).map((button) => button.getAttribute("data-action"));

    expect(actions).toEqual(["minimize", "maximize", "close"]);
    expect(
      mounted.element
        .querySelector<HTMLButtonElement>("[data-action='close']")
        ?.classList.contains(NO_DRAG_REGION_CLASS),
    ).toBe(true);
  });

  it("updates macOS maximize button icon when Alt is pressed", () => {
    const host = document.createElement("div");
    const mounted = mountWindowControls(host, {
      os: "macos",
      adapter: createAdapter(),
    });

    const maximizeButton = mounted.element.querySelector<HTMLButtonElement>(
      "[data-action='maximize']",
    );

    expect(maximizeButton?.title).toBe("Toggle fullscreen");

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Alt" }));

    expect(maximizeButton?.title).toBe("Zoom window");
  });

  it("switches windows maximize icon after clicking", async () => {
    const host = document.createElement("div");
    const mounted = mountWindowControls(host, {
      os: "windows",
      adapter: createAdapter(),
    });

    const maximizeButton = mounted.element.querySelector<HTMLButtonElement>(
      "[data-action='maximize']",
    );

    expect(mounted.element.getAttribute("data-maximized")).toBe("false");

    maximizeButton?.click();
    await Promise.resolve();

    expect(mounted.element.getAttribute("data-maximized")).toBe("true");
  });
});

describe("createTitlebar", () => {
  it("creates a draggable titlebar with platform-correct ordering", () => {
    const titlebar = createTitlebar({
      os: "macos",
      title: "Electrobun Controls",
      adapter: createAdapter(),
    });

    expect(titlebar.element.classList.contains(DRAG_REGION_CLASS)).toBe(true);
    expect(titlebar.contentElement.textContent).toBe("Electrobun Controls");
    expect(titlebar.element.firstElementChild).toBe(
      titlebar.controls.element.parentElement,
    );
  });
});
