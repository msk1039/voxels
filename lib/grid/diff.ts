import { Cell, CellMap } from "./types";

export interface CellTransitionDiff {
  enteringKeys: Set<string>;
  leaving: Cell[];
  maxEnteringDistance: number;
  maxLeavingDistance: number;
}

function radialDistance(cell: Cell) {
  return Math.sqrt(cell.x * cell.x + cell.y * cell.y + cell.z * cell.z);
}

export function diffCellMaps(
  previous: CellMap,
  next: CellMap
): CellTransitionDiff {
  const enteringKeys = new Set<string>();
  const leaving: Cell[] = [];
  let maxEnteringDistance = 0;
  let maxLeavingDistance = 0;

  for (const [key, cell] of next) {
    const previousCell = previous.get(key);
    if (!previousCell || previousCell.material !== cell.material) {
      enteringKeys.add(key);
      maxEnteringDistance = Math.max(maxEnteringDistance, radialDistance(cell));
    }
  }

  for (const [key, cell] of previous) {
    const nextCell = next.get(key);
    if (!nextCell || nextCell.material !== cell.material) {
      leaving.push(cell);
      maxLeavingDistance = Math.max(maxLeavingDistance, radialDistance(cell));
    }
  }

  return {
    enteringKeys,
    leaving,
    maxEnteringDistance,
    maxLeavingDistance,
  };
}
