import { describe, expect, it } from "vitest";

import { createVoxelGroups } from "../../components/renderers/voxel-3d/voxel-groups";
import { CellMap, coordinateKey } from "../../lib/grid";

function cells(...values: Array<[number, number, number, number]>): CellMap {
  return new Map(
    values.map(([x, y, z, material]) => {
      const cell = { x, y, z, material };
      return [coordinateKey(cell), cell];
    })
  );
}

describe("voxel render groups", () => {
  it("shows the target as a ghost before the first run", () => {
    const groups = createVoxelGroups(
      cells([0, 0, 0, 1]),
      new Map(),
      "compare",
      false
    );

    expect(groups).toMatchObject([
      { id: "missing-preview", appearance: "missing", ghost: true },
    ]);
  });

  it("separates all comparison states after a run", () => {
    const target = cells([0, 0, 0, 1], [1, 0, 0, 2], [2, 0, 0, 1]);
    const actual = cells([0, 0, 0, 1], [1, 0, 0, 7], [3, 0, 0, 1]);
    const groups = createVoxelGroups(target, actual, "compare", true);

    expect(Object.fromEntries(groups.map((group) => [group.id, group.cells.length]))).toEqual({
      correct: 1,
      missing: 1,
      extra: 1,
      wrong: 1,
    });
  });

  it("keeps authored material colors in target and result views", () => {
    const target = cells([0, 0, 0, 6]);
    const actual = cells([1, 1, 1, 3]);

    expect(createVoxelGroups(target, actual, "target", true)[0]).toMatchObject({
      appearance: "material",
      cells: [{ material: 6 }],
    });
    expect(createVoxelGroups(target, actual, "result", true)[0]).toMatchObject({
      appearance: "material",
      cells: [{ material: 3 }],
    });
  });
});
