import { EquationMode, EquationValue } from "@/lib/equation";

import { coordinateKey, listCoordinates } from "./coordinates";
import { CellMap, Coordinate, GridSpec } from "./types";

export type TargetPredicate = (coordinate: Coordinate) => EquationValue;

function normalizeTargetValue(value: EquationValue): number {
  if (value === false || value === 0) return 0;
  if (value === true) return 1;
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 8
  ) {
    return value;
  }
  throw new Error("A target must return false, true, 0, or a material from 1 to 8.");
}

export function createTarget(
  mode: EquationMode,
  grid: GridSpec,
  predicate: TargetPredicate
): CellMap {
  const cells: CellMap = new Map();
  for (const coordinate of listCoordinates(mode, grid)) {
    const material = normalizeTargetValue(predicate(coordinate));
    if (material > 0) {
      cells.set(coordinateKey(coordinate), { ...coordinate, material });
    }
  }
  return cells;
}
