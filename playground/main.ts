import "electrobun-controls/style.css"
import { createTitlebar, mountWindowControls } from "electrobun-controls/dom"
import type { RuntimeOS, Theme, WindowControlsAdapter } from "electrobun-controls"

function createMockAdapter(): WindowControlsAdapter {
  let maximized = false

  return {
    close() {
      console.log("close")
    },
    minimize() {
      console.log("minimize")
    },
    toggleMaximize() {
      maximized = !maximized
      console.log("toggleMaximize", maximized)
    },
    getSnapshot() {
      return {
        maximized,
        focused: true,
      }
    },
  }
}

const adapter = createMockAdapter()
const controlsMount = document.getElementById("controls")
const titlebarMount = document.getElementById("titlebar")
const platformSelect = document.getElementById("platform") as HTMLSelectElement
const themeSelect = document.getElementById("theme") as HTMLSelectElement

if (!controlsMount || !titlebarMount) {
  throw new Error("Playground mount points are missing.")
}

let controls = mountWindowControls(controlsMount, {
  adapter,
  os: "macos",
  theme: "light",
})

let titlebar = createTitlebar({
  adapter,
  os: "macos",
  theme: "light",
  title: "Electrobun Controls Playground",
})

titlebarMount.append(titlebar.element)

function render(nextOS: RuntimeOS, nextTheme: Theme) {
  document.body.setAttribute("data-theme", nextTheme === "system" ? "light" : nextTheme)

  controls.update({
    adapter,
    os: nextOS,
    theme: nextTheme,
  })

  titlebar.destroy()
  titlebar = createTitlebar({
    adapter,
    os: nextOS,
    theme: nextTheme,
    title: "Electrobun Controls Playground",
  })
  titlebarMount.replaceChildren(titlebar.element)
}

platformSelect.addEventListener("change", () => {
  render(platformSelect.value as RuntimeOS, themeSelect.value as Theme)
})

themeSelect.addEventListener("change", () => {
  render(platformSelect.value as RuntimeOS, themeSelect.value as Theme)
})
