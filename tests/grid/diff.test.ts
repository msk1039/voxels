import { describe, expect, it } from "vitest";

import { CellMap, coordinateKey, diffCellMaps } from "../../lib/grid";

function cells(...values: Array<[number, number, number, number]>): CellMap {
  return new Map(
    values.map(([x, y, z, material]) => {
      const cell = { x, y, z, material };
      return [coordinateKey(cell), cell];
    })
  );
}

describe("cell transition diff", () => {
  it("animates only added and removed coordinates", () => {
    const previous = cells([0, 0, 0, 1], [3, 0, 0, 2]);
    const next = cells([0, 0, 0, 1], [1, 0, 0, 3]);
    const diff = diffCellMaps(previous, next);

    expect([...diff.enteringKeys]).toEqual(["1,0,0"]);
    expect(diff.leaving).toEqual([{ x: 3, y: 0, z: 0, material: 2 }]);
    expect(diff.maxEnteringDistance).toBe(1);
    expect(diff.maxLeavingDistance).toBe(3);
  });

  it("treats a material change as one removal and one addition", () => {
    const previous = cells([2, 0, 0, 1]);
    const next = cells([2, 0, 0, 6]);
    const diff = diffCellMaps(previous, next);

    expect([...diff.enteringKeys]).toEqual(["2,0,0"]);
    expect(diff.leaving).toEqual([{ x: 2, y: 0, z: 0, material: 1 }]);
  });

  it("does not animate unchanged voxels", () => {
    const previous = cells([0, 0, 0, 4]);
    const diff = diffCellMaps(previous, cells([0, 0, 0, 4]));

    expect(diff.enteringKeys.size).toBe(0);
    expect(diff.leaving).toHaveLength(0);
  });
});
