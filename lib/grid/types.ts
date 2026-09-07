import { EquationMode } from "@/lib/equation";

export interface GridSpec {
  min: number;
  max: number;
  step: number;
}

export interface Coordinate {
  x: number;
  y: number;
  z: number;
}

export interface Cell extends Coordinate {
  material: number;
}

export type CellMap = Map<string, Cell>;

export interface GridEvaluation {
  mode: EquationMode;
  cells: CellMap;
  complexity: number;
}

export interface MatchResult {
  correct: Cell[];
  missing: Cell[];
  extra: Cell[];
  wrongMaterial: Array<{ expected: Cell; actual: Cell }>;
  targetCoverage: number;
  exact: boolean;
}
