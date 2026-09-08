import { describe, expect, it } from "vitest";

import {
  enteringVoxelScale,
  exitingVoxelScale,
} from "../../components/renderers/voxel-3d/voxel-transition";

const center = { x: 0, y: 0, z: 0, material: 1 };
const outer = { x: 5, y: 0, z: 0, material: 1 };

describe("radial voxel transition", () => {
  it("removes outer voxels before inner voxels", () => {
    expect(exitingVoxelScale(0.1, outer, 5)).toBeLessThan(1);
    expect(exitingVoxelScale(0.1, center, 5)).toBe(1);
  });

  it("adds voxels outward from the equation origin", () => {
    expect(enteringVoxelScale(0.56, center, 5)).toBeGreaterThan(0);
    expect(enteringVoxelScale(0.56, outer, 5)).toBe(0);
  });

  it("finishes both transition phases", () => {
    expect(exitingVoxelScale(1, center, 5)).toBe(0);
    expect(enteringVoxelScale(1, outer, 5)).toBe(1);
  });
});
