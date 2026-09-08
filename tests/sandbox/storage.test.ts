import { describe, expect, it } from "vitest";

import { SANDBOX_STORAGE_KEY } from "../../lib/progress";
import {
  DEFAULT_SANDBOX_DRAFTS,
  loadSandboxDrafts,
  parseSandboxDrafts,
  saveSandboxDrafts,
} from "../../lib/sandbox";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("sandbox drafts", () => {
  it("uses starter equations when storage is invalid", () => {
    expect(parseSandboxDrafts({ schemaVersion: 4 })).toBe(
      DEFAULT_SANDBOX_DRAFTS
    );
  });

  it("stores both modes under the sandbox-only key", () => {
    const storage = new MemoryStorage();
    const drafts = {
      schemaVersion: 1 as const,
      sources: { "2d": "x == 0", "3d": "z == 0" },
    };
    saveSandboxDrafts(storage, drafts);

    expect(storage.getItem(SANDBOX_STORAGE_KEY)).toContain("z == 0");
    expect(loadSandboxDrafts(storage)).toEqual(drafts);
  });
});
