import { SETTINGS_STORAGE_KEY } from "@/lib/progress";

import { GraphicsQuality, SettingsState } from "./types";

export const DEFAULT_SETTINGS: SettingsState = {
  schemaVersion: 1,
  graphicsQuality: "auto",
};

function isGraphicsQuality(value: unknown): value is GraphicsQuality {
  return value === "auto" || value === "high" || value === "reduced";
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
