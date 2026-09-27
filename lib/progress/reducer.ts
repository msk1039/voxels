import { LevelCompletion, ProgressState, ProgressStats, RunRecord } from "./types";

export const EMPTY_STATS: ProgressStats = Object.freeze({
  runs: 0,
  failedRuns: 0,
  hintsOpened: 0,
  sandboxRuns: 0,
});

export const EMPTY_PROGRESS: ProgressState = Object.freeze({
  schemaVersion: 2,
  levels: Object.freeze({}),
  stats: EMPTY_STATS,
  achievements: Object.freeze({}),
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
    ...state,
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

export function recordRun(state: ProgressState, run: RunRecord): ProgressState {
  const stats = { ...state.stats };
  if (run.context === "sandbox") {
    stats.sandboxRuns += 1;
  } else {
    stats.runs += 1;
    if (!run.solved) stats.failedRuns += 1;
  }
  return { ...state, stats };
}

export function recordHintOpened(state: ProgressState): ProgressState {
  return {
    ...state,
    stats: { ...state.stats, hintsOpened: state.stats.hintsOpened + 1 },
  };
}

export function unlockAchievements(
  state: ProgressState,
  ids: readonly string[]
): ProgressState {
  if (ids.length === 0) return state;
  const achievements = { ...state.achievements };
  for (const id of ids) achievements[id] = true;
  return { ...state, achievements };
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
