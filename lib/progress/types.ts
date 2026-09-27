export interface EarnedBlocks {
  complete: boolean;
  noHints: boolean;
  efficient: boolean;
}

export interface LevelProgress {
  completed: boolean;
  earnedBlocks: EarnedBlocks;
  bestComplexity: number | null;
  bestExpression: string | null;
}

/** Lifetime counters that some achievements are based on. */
export interface ProgressStats {
  /** Equations run against a level target, solved or not. */
  runs: number;
  /** Level runs that errored or did not match the target. */
  failedRuns: number;
  hintsOpened: number;
  sandboxRuns: number;
}

export interface ProgressState {
  schemaVersion: 2;
  levels: Record<string, LevelProgress>;
  stats: ProgressStats;
  /** Unlocked achievement ids, so new unlocks can be announced once. */
  achievements: Record<string, true>;
}

export interface LevelCompletion {
  levelKey: string;
  expression: string;
  complexity: number;
  efficientCost: number;
  usedHint: boolean;
}

export type RunRecord =
  | { context: "level"; solved: boolean }
  | { context: "sandbox" };
