import { describe, expect, it } from "vitest";

import {
  computeNeighborMask,
  hasNeighbor,
  neighborBit,
} from "../../components/renderers/voxel-3d/neighbor-mask";

describe("neighbor mask", () => {
  it("assigns each of the 26 neighbours a unique bit", () => {
    const bits = new Set<number>();
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          if (dx === 0 && dy === 0 && dz === 0) continue;
          bits.add(neighborBit(dx, dy, dz));
        }
      }
    }
    expect(bits.size).toBe(26);
    expect(Math.min(...bits)).toBe(0);
    expect(Math.max(...bits)).toBe(25);
  });

  it("packs solid neighbours into two words that fit a float exactly", () => {
    const solid = new Set(["1,0,0", "-1,-1,-1", "1,1,1", "5,5,5"]);
    const mask = computeNeighborMask({ x: 0, y: 0, z: 0 }, solid);

    expect(hasNeighbor(mask, 1, 0, 0)).toBe(true);
    expect(hasNeighbor(mask, -1, -1, -1)).toBe(true);
    expect(hasNeighbor(mask, 1, 1, 1)).toBe(true);
    expect(hasNeighbor(mask, 0, 1, 0)).toBe(false);
    expect(mask[0]).toBeLessThan(2 ** 13);
    expect(mask[1]).toBeLessThan(2 ** 13);
  });

  it("is empty for an isolated block", () => {
    expect(computeNeighborMask({ x: 0, y: 0, z: 0 }, new Set())).toEqual([0, 0]);
  });
});
