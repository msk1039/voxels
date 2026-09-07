import { LevelDefinition, getLevelsForMode } from "@/content/levels";

import { levelProgressKey } from "./reducer";
import { ProgressState } from "./types";

export function isLevelUnlocked(
  level: LevelDefinition,
  progress: ProgressState
): boolean {
  if (level.order === 1) return true;
  const previous = getLevelsForMode(level.mode).find(
    (candidate) => candidate.order === level.order - 1
  );
  if (!previous) return false;
  return Boolean(
    progress.levels[levelProgressKey(previous.mode, previous.id)]?.completed
  );
}

export function getContinueLevel(
  mode: "2d" | "3d",
  progress: ProgressState
): LevelDefinition {
  const levels = getLevelsForMode(mode);
  return (
    levels.find((level) => !progress.levels[levelProgressKey(mode, level.id)]?.completed) ??
    levels.at(-1)!
  );
}
