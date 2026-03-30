import {
  createControlsController,
  type ControlsController,
  type CreateControlsControllerOptions,
} from "../core/controller";
import type { ControlVariant, Theme } from "../core/types";
import { macosIcons, ubuntuIcons, windowsIcons } from "./icons";
import { NO_DRAG_REGION_CLASS } from "./constants";

export interface MountWindowControlsOptions extends CreateControlsControllerOptions {
  className?: string;
  theme?: Theme;
  label?: string;
  onActionError?: (
    error: unknown,
    action: "close" | "minimize" | "maximize",
  ) => void;
}

export interface MountedWindowControls {
  element: HTMLDivElement;
  controller: ControlsController;
  update: (options?: Partial<MountWindowControlsOptions>) => void;
  destroy: () => void;
}

interface RenderContext {
  root: HTMLDivElement;
  options: MountWindowControlsOptions;
  controller: ControlsController;
  cleanup: Set<() => void>;
}

function createButton({
  action,
  title,
  variant,
  icon,
}: {
  action: "close" | "minimize" | "maximize";
  title: string;
  variant: ControlVariant;
  icon: string;
}): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `eb-controls__button eb-controls__button--${variant} eb-controls__button--${action} ${NO_DRAG_REGION_CLASS}`;
  button.setAttribute("data-action", action);
  button.setAttribute("aria-label", title);
  button.title = title;
  button.innerHTML = `<span class="eb-controls__icon">${icon}</span>`;
  return button;
}

function getButtons(variant: ControlVariant) {
  if (variant === "macos") {
    return [
      createButton({
        action: "close",
        title: "Close window",
        variant,
        icon: macosIcons.close,
      }),
      createButton({
        action: "minimize",
        title: "Minimize window",
        variant,
        icon: macosIcons.minimize,
      }),
      createButton({
        action: "maximize",
        title: "Toggle fullscreen",
        variant,
        icon: macosIcons.fullscreen,
      }),
    ];
  }

  if (variant === "ubuntu") {
    return [
      createButton({
        action: "minimize",
        title: "Minimize window",
        variant,
        icon: ubuntuIcons.minimize,
      }),
      createButton({
        action: "maximize",
        title: "Maximize window",
        variant,
        icon: ubuntuIcons.maximize,
      }),
      createButton({
        action: "close",
        title: "Close window",
        variant,
        icon: ubuntuIcons.close,
      }),
    ];
  }

  return [
    createButton({
      action: "minimize",
      title: "Minimize window",
      variant,
      icon: windowsIcons.minimize,
    }),
    createButton({
      action: "maximize",
      title: "Maximize window",
      variant,
      icon: windowsIcons.maximize,
    }),
    createButton({
      action: "close",
      title: "Close window",
      variant,
      icon: windowsIcons.close,
    }),
  ];
}

function renderIcons(
  root: HTMLElement,
  variant: ControlVariant,
  maximized: boolean,
) {
  const maximizeButton = root.querySelector<HTMLButtonElement>(
    '[data-action="maximize"]',
  );

  if (!maximizeButton) return;

  if (variant === "macos") {
    const icon =
      root.getAttribute("data-alt-key") === "true"
        ? macosIcons.plus
        : macosIcons.fullscreen;
    maximizeButton.innerHTML = `<span class="eb-controls__icon">${icon}</span>`;
    maximizeButton.title =
      root.getAttribute("data-alt-key") === "true"
        ? "Zoom window"
        : "Toggle fullscreen";
    maximizeButton.setAttribute("aria-label", maximizeButton.title);
    return;
  }

  if (variant === "ubuntu") {
    maximizeButton.innerHTML = `<span class="eb-controls__icon">${
      maximized ? ubuntuIcons.restore : ubuntuIcons.maximize
    }</span>`;
    maximizeButton.title = maximized ? "Restore window" : "Maximize window";
    maximizeButton.setAttribute("aria-label", maximizeButton.title);
    return;
  }

  maximizeButton.innerHTML = `<span class="eb-controls__icon">${
    maximized ? windowsIcons.restore : windowsIcons.maximize
  }</span>`;
  maximizeButton.title = maximized ? "Restore window" : "Maximize window";
  maximizeButton.setAttribute("aria-label", maximizeButton.title);
}

function bindAltKey(
  root: HTMLElement,
  cleanup: Set<() => void>,
  controller: ControlsController,
) {
  if (typeof window === "undefined") return;

  const updateAlt = (pressed: boolean) => {
    root.setAttribute("data-alt-key", String(pressed));
    const state = controller.getState();
    renderIcons(root, state.variant, state.snapshot.maximized);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Alt") updateAlt(true);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === "Alt") updateAlt(false);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  cleanup.add(() => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  });
}

function updateRootState(
  root: HTMLDivElement,
  controller: ControlsController,
  options: MountWindowControlsOptions,
) {
  const state = controller.getState();
  root.className = ["eb-controls", options.className].filter(Boolean).join(" ");
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", options.label ?? "Window controls");
  root.setAttribute("data-variant", state.variant);
  root.setAttribute("data-os", state.os);
  root.setAttribute("data-theme", options.theme ?? "system");
  root.setAttribute("data-focused", String(state.snapshot.focused));
  root.setAttribute("data-maximized", String(state.snapshot.maximized));
  root.setAttribute(
    "data-fullscreen-capable",
    String(Boolean(options.adapter?.toggleFullscreen)),
  );
  renderIcons(root, state.variant, state.snapshot.maximized);
}

function rebuildChildren(context: RenderContext) {
  const state = context.controller.getState();
  context.root.innerHTML = "";

  const buttons = getButtons(state.variant);
  for (const button of buttons) {
    context.root.append(button);
  }

  updateRootState(context.root, context.controller, context.options);

  for (const button of buttons) {
    const action = button.getAttribute("data-action");
    if (!action) continue;

    const listener = async () => {
      try {
        if (action === "close") {
          await context.controller.close();
        } else if (action === "minimize") {
          await context.controller.minimize();
        } else {
          const wantsFullscreen =
            state.variant === "macos" &&
            context.root.getAttribute("data-alt-key") !== "true";

          if (wantsFullscreen) {
            await context.controller.toggleFullscreen();
          } else {
            await context.controller.toggleMaximize();
          }
        }
      } catch (error) {
        context.options.onActionError?.(
          error,
          action as "close" | "minimize" | "maximize",
        );
      }
    };

    button.addEventListener("click", listener);
    context.cleanup.add(() => button.removeEventListener("click", listener));
  }
}

export function mountWindowControls(
  target: HTMLElement,
  options: MountWindowControlsOptions = {},
): MountedWindowControls {
  const root = document.createElement("div");
  const cleanup = new Set<() => void>();
  let currentOptions = { ...options };
  let controller = createControlsController(currentOptions);

  target.replaceChildren(root);

  const context: RenderContext = {
    root,
    options: currentOptions,
    controller,
    cleanup,
  };

  bindAltKey(root, cleanup, controller);
  rebuildChildren(context);

  const unsubscribe = controller.subscribe(() => {
    updateRootState(root, controller, currentOptions);
  });
  cleanup.add(unsubscribe);

  return {
    element: root,
    controller,
    update(nextOptions = {}) {
      for (const dispose of cleanup) {
        dispose();
      }
      cleanup.clear();

      controller.destroy();

      currentOptions = {
        ...currentOptions,
        ...nextOptions,
      };

      controller = createControlsController(currentOptions);
      context.options = currentOptions;
      context.controller = controller;

      bindAltKey(root, cleanup, controller);
      rebuildChildren(context);

      const nextUnsubscribe = controller.subscribe(() => {
        updateRootState(root, controller, currentOptions);
      });
      cleanup.add(nextUnsubscribe);
    },
    destroy() {
      for (const dispose of cleanup) {
        dispose();
      }
      cleanup.clear();
      controller.destroy();
      root.remove();
    },
  };
}
