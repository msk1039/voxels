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

export interface ProgressState {
  schemaVersion: 1;
  levels: Record<string, LevelProgress>;
}

export interface LevelCompletion {
  levelKey: string;
  expression: string;
  complexity: number;
  efficientCost: number;
  usedHint: boolean;
}
