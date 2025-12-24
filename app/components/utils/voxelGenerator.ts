import { VoxelData } from "../types";
import { GRID_SIZE } from "../constants";

export function evaluateEquation(
  code: string,
  x: number,
  y: number,
  z: number
): number | null {
  try {
    const func = new Function("x", "y", "z", code);
    const result = func(x, y, z);
    if (result === true) return 0;
    if (typeof result === "number" && result >= 1 && result <= 10) {
      return Math.floor(result);
    }
    return null;
  } catch {
    return null;
  }
}

export function generateVoxels(equation: string): VoxelData[] {
  const OFFSET = (GRID_SIZE - 1) / 2;
  const result: VoxelData[] = [];

  for (let xi = 0; xi < GRID_SIZE; xi++) {
    for (let yi = 0; yi < GRID_SIZE; yi++) {
      for (let zi = 0; zi < GRID_SIZE; zi++) {
        const x = xi - OFFSET;
        const y = yi - OFFSET;
        const z = zi - OFFSET;
        const colorResult = evaluateEquation(equation, x, y, z);
        if (colorResult !== null) {
          result.push({
            pos: [x, y, z],
            colorNum: colorResult,
            dist: Math.sqrt(x * x + y * y + z * z),
          });
        }
      }
    }
  }
  return result;
}
