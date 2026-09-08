import { SANDBOX_STORAGE_KEY } from "@/lib/progress";

import { SandboxDrafts } from "./types";

export const SANDBOX_STARTERS: Readonly<Record<"2d" | "3d", string>> = {
  "2d": "abs(x) + abs(y) <= 4 ? 5 : 0",
  "3d": "x*x + y*y + z*z <= 16 ? 6 : 0",
};

export const DEFAULT_SANDBOX_DRAFTS: SandboxDrafts = {
  schemaVersion: 1,
  sources: { ...SANDBOX_STARTERS },
};

export function parseSandboxDrafts(value: unknown): SandboxDrafts {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 1 ||
    !("sources" in value) ||
    typeof value.sources !== "object" ||
    value.sources === null ||
    !("2d" in value.sources) ||
    !("3d" in value.sources) ||
    typeof value.sources["2d"] !== "string" ||
    typeof value.sources["3d"] !== "string"
  ) {
    return DEFAULT_SANDBOX_DRAFTS;
  }

  return {
    schemaVersion: 1,
    sources: {
      "2d": value.sources["2d"],
      "3d": value.sources["3d"],
    },
  };
}

export function loadSandboxDrafts(
  storage: Pick<Storage, "getItem">
): SandboxDrafts {
  try {
    const value = storage.getItem(SANDBOX_STORAGE_KEY);
    return value
      ? parseSandboxDrafts(JSON.parse(value))
      : DEFAULT_SANDBOX_DRAFTS;
  } catch {
    return DEFAULT_SANDBOX_DRAFTS;
  }
}

export function saveSandboxDrafts(
  storage: Pick<Storage, "setItem">,
  drafts: SandboxDrafts
) {
  storage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(drafts));
}
