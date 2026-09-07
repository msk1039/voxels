import { EMPTY_PROGRESS } from "./reducer";
import { LevelProgress, ProgressState } from "./types";

export const PROGRESS_STORAGE_KEY = "voxels:level-progress:v1";
export const SANDBOX_STORAGE_KEY = "voxels:sandbox-draft:v1";
export const SETTINGS_STORAGE_KEY = "voxels:settings:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLevelProgress(value: unknown): LevelProgress | null {
  if (!isRecord(value) || value.completed !== true) return null;
  const blocks = value.earnedBlocks;
  if (
    !isRecord(blocks) ||
    typeof blocks.complete !== "boolean" ||
    typeof blocks.noHints !== "boolean" ||
    typeof blocks.efficient !== "boolean"
  ) {
    return null;
  }
  const bestComplexity =
    typeof value.bestComplexity === "number" &&
    Number.isFinite(value.bestComplexity)
      ? value.bestComplexity
      : null;
  const bestExpression =
    typeof value.bestExpression === "string" ? value.bestExpression : null;
  return {
    completed: true,
    earnedBlocks: {
      complete: blocks.complete,
      noHints: blocks.noHints,
      efficient: blocks.efficient,
    },
    bestComplexity,
    bestExpression,
  };
}

export function parseProgress(value: unknown): ProgressState {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !isRecord(value.levels)
  ) {
    return EMPTY_PROGRESS;
  }
  const levels: Record<string, LevelProgress> = {};
  for (const [key, candidate] of Object.entries(value.levels)) {
    const parsed = parseLevelProgress(candidate);
    if (parsed) levels[key] = parsed;
  }
  return { schemaVersion: 1, levels };
}

export function loadProgress(storage: Pick<Storage, "getItem">): ProgressState {
  try {
    const value = storage.getItem(PROGRESS_STORAGE_KEY);
    return value ? parseProgress(JSON.parse(value)) : EMPTY_PROGRESS;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(
  storage: Pick<Storage, "setItem">,
  progress: ProgressState
) {
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

export function clearLevelProgress(storage: Pick<Storage, "removeItem">) {
  storage.removeItem(PROGRESS_STORAGE_KEY);
}
