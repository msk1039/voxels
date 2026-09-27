import { EMPTY_PROGRESS, EMPTY_STATS } from "./reducer";
import { LevelProgress, ProgressState, ProgressStats } from "./types";

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

function parseCount(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function parseStats(value: unknown): ProgressStats {
  if (!isRecord(value)) return EMPTY_STATS;
  return {
    runs: parseCount(value.runs),
    failedRuns: parseCount(value.failedRuns),
    hintsOpened: parseCount(value.hintsOpened),
    sandboxRuns: parseCount(value.sandboxRuns),
  };
}

function parseAchievements(value: unknown): Record<string, true> {
  const achievements: Record<string, true> = {};
  if (!isRecord(value)) return achievements;
  for (const [id, unlocked] of Object.entries(value)) {
    if (unlocked === true) achievements[id] = true;
  }
  return achievements;
}

/**
 * Reads stored progress. Version 1 had only levels; it migrates to
 * version 2 with zeroed stats and no recorded achievements. Earned
 * achievements are recorded again, silently, when progress loads.
 */
export function parseProgress(value: unknown): ProgressState {
  if (
    !isRecord(value) ||
    (value.schemaVersion !== 1 && value.schemaVersion !== 2) ||
    !isRecord(value.levels)
  ) {
    return EMPTY_PROGRESS;
  }
  const levels: Record<string, LevelProgress> = {};
  for (const [key, candidate] of Object.entries(value.levels)) {
    const parsed = parseLevelProgress(candidate);
    if (parsed) levels[key] = parsed;
  }
  if (value.schemaVersion === 1) {
    return { schemaVersion: 2, levels, stats: EMPTY_STATS, achievements: {} };
  }
  return {
    schemaVersion: 2,
    levels,
    stats: parseStats(value.stats),
    achievements: parseAchievements(value.achievements),
  };
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
