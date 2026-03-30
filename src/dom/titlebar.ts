import type { Theme } from "../core/types"
import { resolveControlVariant } from "../core/os"
import { DRAG_REGION_CLASS } from "./constants"
import {
  mountWindowControls,
  type MountedWindowControls,
  type MountWindowControlsOptions,
} from "./render"

export interface CreateTitlebarOptions extends MountWindowControlsOptions {
  title?: string
  controlsPosition?: "auto" | "left" | "right"
  className?: string
  contentClassName?: string
  theme?: Theme
}

export interface TitlebarHandle {
  element: HTMLDivElement
  contentElement: HTMLDivElement
  controls: MountedWindowControls
  destroy: () => void
}

export function createTitlebar(
  options: CreateTitlebarOptions = {}
): TitlebarHandle {
  const element = document.createElement("div")
  const controlsHost = document.createElement("div")
  const contentElement = document.createElement("div")
  const variant = resolveControlVariant({
    os: options.os,
    variant: options.variant,
  })
  const controlsPosition =
    options.controlsPosition === "auto" || !options.controlsPosition
      ? variant === "macos"
        ? "left"
        : "right"
      : options.controlsPosition

  element.className = ["eb-titlebar", options.className, DRAG_REGION_CLASS]
    .filter(Boolean)
    .join(" ")
  element.setAttribute("data-variant", variant)
  element.setAttribute("data-theme", options.theme ?? "system")

  contentElement.className = [
    "eb-titlebar__content",
    options.contentClassName,
  ]
    .filter(Boolean)
    .join(" ")
  if (options.title) {
    contentElement.textContent = options.title
  }

  controlsHost.className = "eb-titlebar__controls"

  const controls = mountWindowControls(controlsHost, options)

  if (controlsPosition === "left") {
    element.append(controlsHost, contentElement)
  } else {
    element.append(contentElement, controlsHost)
  }

  return {
    element,
    contentElement,
    controls,
    destroy() {
      controls.destroy()
      element.remove()
    },
  }
}
