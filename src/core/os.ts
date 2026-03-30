import type { ControlVariant, RuntimeOS } from "./types"

export interface DetectRuntimeOSInput {
  os?: RuntimeOS
}

export interface ResolveControlVariantInput {
  os?: RuntimeOS
  variant?: ControlVariant
}

function mapProcessPlatform(platform: string | undefined): RuntimeOS | undefined {
  if (platform === "darwin") return "macos"
  if (platform === "win32") return "windows"
  if (platform === "linux") return "linux"
  return undefined
}

function mapNavigatorPlatform(value: string | undefined): RuntimeOS | undefined {
  if (!value) return undefined

  const lower = value.toLowerCase()

  if (
    lower.includes("mac") ||
    lower.includes("darwin") ||
    lower.includes("iphone") ||
    lower.includes("ipad")
  ) {
    return "macos"
  }

  if (lower.includes("win")) return "windows"
  if (lower.includes("linux") || lower.includes("x11")) return "linux"

  return undefined
}

export function detectRuntimeOS(input: DetectRuntimeOSInput = {}): RuntimeOS {
  if (input.os) return input.os

  const processOS = mapProcessPlatform(
    typeof process !== "undefined" ? process.platform : undefined
  )
  if (processOS) return processOS

  if (typeof navigator !== "undefined") {
    const candidate =
      mapNavigatorPlatform(navigator.userAgentData?.platform) ??
      mapNavigatorPlatform(navigator.platform) ??
      mapNavigatorPlatform(navigator.userAgent)

    if (candidate) return candidate
  }

  return "unknown"
}

export function resolveControlVariant(
  input: ResolveControlVariantInput = {}
): ControlVariant {
  if (input.variant) return input.variant

  const os = detectRuntimeOS({ os: input.os })

  if (os === "macos") return "macos"
  if (os === "linux") return "ubuntu"
  return "windows"
}
