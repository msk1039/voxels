import { EquationMode } from "@/lib/equation";

import { Coordinate, GridSpec } from "./types";

function clean(value: number) {
  return Object.is(value, -0) ? 0 : Number(value.toFixed(8));
}

export function coordinateKey({ x, y, z }: Coordinate): string {
  return `${x},${y},${z}`;
}

export function listAxisValues(grid: GridSpec): number[] {
  const values: number[] = [];
  for (let value = grid.min; value <= grid.max + Number.EPSILON; value += grid.step) {
    values.push(clean(value));
  }
  return values;
}

export function listCoordinates(
  mode: EquationMode,
  grid: GridSpec
): Coordinate[] {
  const axis = listAxisValues(grid);
  const coordinates: Coordinate[] = [];
  for (const y of axis) {
    for (const x of axis) {
      if (mode === "2d") {
        coordinates.push({ x, y, z: 0 });
        continue;
      }
      for (const z of axis) coordinates.push({ x, y, z });
    }
  }
  return coordinates;
}
