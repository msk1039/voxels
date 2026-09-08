import { SETTINGS_STORAGE_KEY } from "@/lib/progress";

import {
  FrameRate,
  GraphicsQuality,
  RenderScale,
  SettingsState,
} from "./types";

export const DEFAULT_SETTINGS: SettingsState = {
  schemaVersion: 1,
  graphicsQuality: "auto",
  renderScale: "auto",
  frameRate: "auto",
};

function isGraphicsQuality(value: unknown): value is GraphicsQuality {
  return value === "auto" || value === "high" || value === "reduced";
}

function isRenderScale(value: unknown): value is RenderScale {
  return (
    value === "auto" ||
    value === "full" ||
    value === "balanced" ||
    value === "performance"
  );
}

function isFrameRate(value: unknown): value is FrameRate {
  return value === "auto" || value === "60" || value === "30";
}

export function parseSettings(value: unknown): SettingsState {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 1 ||
    !("graphicsQuality" in value) ||
    !isGraphicsQuality(value.graphicsQuality)
  ) {
    return DEFAULT_SETTINGS;
  }

  return {
    schemaVersion: 1,
    graphicsQuality: value.graphicsQuality,
    renderScale:
      "renderScale" in value && isRenderScale(value.renderScale)
        ? value.renderScale
        : DEFAULT_SETTINGS.renderScale,
    frameRate:
      "frameRate" in value && isFrameRate(value.frameRate)
        ? value.frameRate
        : DEFAULT_SETTINGS.frameRate,
  };
}

export function loadSettings(storage: Pick<Storage, "getItem">): SettingsState {
  try {
    const value = storage.getItem(SETTINGS_STORAGE_KEY);
    return value ? parseSettings(JSON.parse(value)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(
  storage: Pick<Storage, "setItem">,
  settings: SettingsState
) {
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
