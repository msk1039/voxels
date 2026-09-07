import {
  CompiledEquation,
  EquationMode,
  compileEquation,
  evaluateMaterial,
} from "@/lib/equation";

import { coordinateKey, listCoordinates } from "./coordinates";
import { CellMap, GridEvaluation, GridSpec } from "./types";

export function evaluateCompiledGrid(
  equation: CompiledEquation,
  grid: GridSpec
): GridEvaluation {
  const cells: CellMap = new Map();
  for (const coordinate of listCoordinates(equation.mode, grid)) {
    const material = evaluateMaterial(equation, coordinate);
    if (material > 0) {
      cells.set(coordinateKey(coordinate), { ...coordinate, material });
    }
  }
  return {
    mode: equation.mode,
    cells,
    complexity: equation.complexity,
  };
}

export function evaluateGrid(
  source: string,
  mode: EquationMode,
  grid: GridSpec
): GridEvaluation {
  return evaluateCompiledGrid(compileEquation(source, mode), grid);
}
