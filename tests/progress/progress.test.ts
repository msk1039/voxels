import { describe, expect, it } from "vitest";

import {
  EMPTY_PROGRESS,
  PROGRESS_STORAGE_KEY,
  SANDBOX_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  applyLevelCompletion,
  clearLevelProgress,
  loadProgress,
} from "../../lib/progress";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("local progress", () => {
  it("keeps the best result while merging earned blocks", () => {
    const first = applyLevelCompletion(EMPTY_PROGRESS, {
      levelKey: "2d:origin",
      expression: "x == 0 && y == 0",
      complexity: 3,
      efficientCost: 3,
      usedHint: true,
    });
    const replay = applyLevelCompletion(first, {
      levelKey: "2d:origin",
      expression: "y == 0 && x == 0",
      complexity: 3,
      efficientCost: 2,
      usedHint: false,
    });
    expect(replay.levels["2d:origin"].earnedBlocks).toEqual({
      complete: true,
      noHints: true,
      efficient: true,
    });
    expect(replay.levels["2d:origin"].bestExpression).toBe(
      "x == 0 && y == 0"
    );
  });

  it("returns empty progress for malformed storage", () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_STORAGE_KEY, "{not json");
    expect(loadProgress(storage).levels).toEqual({});
  });

  it("resets only level progress", () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, levels: {} }));
    storage.setItem(SANDBOX_STORAGE_KEY, "sandbox");
    storage.setItem(SETTINGS_STORAGE_KEY, "settings");

    clearLevelProgress(storage);

    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SANDBOX_STORAGE_KEY)).toBe("sandbox");
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toBe("settings");
  });
});
