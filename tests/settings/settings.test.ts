import { describe, expect, it } from "vitest";

import { SETTINGS_STORAGE_KEY } from "../../lib/progress";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  parseSettings,
  saveSettings,
} from "../../lib/settings";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("local settings", () => {
  it("falls back when persisted settings are malformed", () => {
    expect(parseSettings({ schemaVersion: 1, graphicsQuality: "ultra" })).toBe(
      DEFAULT_SETTINGS
    );
  });

  it("migrates older settings with safe render defaults", () => {
    expect(
      parseSettings({ schemaVersion: 1, graphicsQuality: "high" })
    ).toEqual({
      schemaVersion: 1,
      graphicsQuality: "high",
      renderScale: "auto",
      frameRate: "auto",
    });
  });

  it("persists the selected render controls", () => {
    const storage = new MemoryStorage();
    saveSettings(storage, {
      schemaVersion: 1,
      graphicsQuality: "reduced",
      renderScale: "balanced",
      frameRate: "30",
    });

    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toContain("reduced");
    expect(loadSettings(storage)).toEqual({
      schemaVersion: 1,
      graphicsQuality: "reduced",
      renderScale: "balanced",
      frameRate: "30",
    });
  });
});
