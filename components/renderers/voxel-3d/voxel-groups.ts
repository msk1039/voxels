import { CellMap, matchCells } from "@/lib/grid";

import { VoxelGroup } from "./types";

export function createVoxelGroups(
  target: CellMap,
  actual: CellMap,
  view: "compare" | "target" | "result",
  hasRun: boolean
): VoxelGroup[] {
  if (view === "target") {
    return [
      {
        id: "target",
        cells: [...target.values()],
        appearance: "material",
        label: "Target",
      },
    ];
  }

  if (view === "result") {
    return [
      {
        id: "result",
        cells: [...actual.values()],
        appearance: "material",
        label: "Result",
      },
    ];
  }

  if (!hasRun) {
    return [
      {
        id: "missing-preview",
        cells: [...target.values()],
        appearance: "missing",
        label: "Missing target voxel",
        ghost: true,
      },
    ];
  }

  const match = matchCells(target, actual);
  return [
    {
      id: "correct",
      cells: match.correct,
      appearance: "correct",
      label: "Correct voxel",
    },
    {
      id: "missing",
      cells: match.missing,
      appearance: "missing",
      label: "Missing target voxel",
      ghost: true,
    },
    {
      id: "extra",
      cells: match.extra,
      appearance: "extra",
      label: "Extra voxel",
    },
    {
      id: "wrong",
      cells: match.wrongMaterial.map(({ actual: cell }) => cell),
      appearance: "wrong",
      label: "Wrong material",
    },
  ].filter((group) => group.cells.length > 0) as VoxelGroup[];
}
