import { GridSpec, listAxisValues } from "@/lib/grid";

export interface CoordinateGuideLayout {
  low: number;
  high: number;
  center: number;
  size: number;
  ticks: number[];
}

export function createCoordinateGuideLayout(
  grid: GridSpec
): CoordinateGuideLayout {
  const halfStep = grid.step / 2;
  return {
    low: grid.min - halfStep,
    high: grid.max + halfStep,
    center: (grid.min + grid.max) / 2,
    size: grid.max - grid.min + grid.step,
    ticks: listAxisValues(grid),
  };
}

export function formatCoordinateTick(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
