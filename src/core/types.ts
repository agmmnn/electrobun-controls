export type RuntimeOS = "macos" | "windows" | "linux" | "unknown";

export type ControlVariant = "macos" | "windows" | "ubuntu";

export type Theme = "system" | "light" | "dark";

export interface WindowControlsSnapshot {
  maximized: boolean;
  focused: boolean;
}

export interface WindowControlsState {
  os: RuntimeOS;
  variant: ControlVariant;
  snapshot: WindowControlsSnapshot;
}

export type WindowControlsListener = (snapshot: WindowControlsSnapshot) => void;

export interface WindowControlsAdapter {
  close: () => void | Promise<void>;
  minimize: () => void | Promise<void>;
  toggleMaximize: () => void | Promise<void>;
  toggleFullscreen?: () => void | Promise<void>;
  getSnapshot?: () =>
    | Partial<WindowControlsSnapshot>
    | Promise<Partial<WindowControlsSnapshot>>;
  subscribe?: (
    listener: WindowControlsListener,
  ) => void | (() => void) | Promise<void | (() => void)>;
}
