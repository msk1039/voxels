import { LevelCompletion, ProgressState } from "./types";

export const EMPTY_PROGRESS: ProgressState = Object.freeze({
  schemaVersion: 1,
  levels: Object.freeze({}),
});

export function levelProgressKey(mode: "2d" | "3d", levelId: string) {
  return `${mode}:${levelId}`;
}

export function applyLevelCompletion(
  state: ProgressState,
  completion: LevelCompletion
): ProgressState {
  const previous = state.levels[completion.levelKey];
  const isBetter =
    previous?.bestComplexity == null ||
    completion.complexity < previous.bestComplexity;

  return {
    schemaVersion: 1,
    levels: {
      ...state.levels,
      [completion.levelKey]: {
        completed: true,
        earnedBlocks: {
          complete: true,
          noHints:
            previous?.earnedBlocks.noHints === true || !completion.usedHint,
          efficient:
            previous?.earnedBlocks.efficient === true ||
            completion.complexity <= completion.efficientCost,
        },
        bestComplexity: isBetter
          ? completion.complexity
          : (previous?.bestComplexity ?? completion.complexity),
        bestExpression: isBetter
          ? completion.expression
          : (previous?.bestExpression ?? completion.expression),
      },
    },
  };
}

export function countCompleted(
  state: ProgressState,
  mode?: "2d" | "3d"
): number {
  return Object.entries(state.levels).filter(
    ([key, value]) => value.completed && (!mode || key.startsWith(`${mode}:`))
  ).length;
}

export function countEarnedBlocks(state: ProgressState): number {
  return Object.values(state.levels).reduce((total, level) => {
    return (
      total +
      Number(level.earnedBlocks.complete) +
      Number(level.earnedBlocks.noHints) +
      Number(level.earnedBlocks.efficient)
    );
  }, 0);
}
