import { describe, expect, it } from "vitest";

import {
  createCoordinateGuideLayout,
  formatCoordinateTick,
} from "@/components/renderers/voxel-3d/coordinate-guide-layout";

describe("coordinate guide layout", () => {
  it("places the guide on voxel cell boundaries", () => {
    expect(
      createCoordinateGuideLayout({ min: -5, max: 5, step: 1 })
    ).toEqual({
      low: -5.5,
      high: 5.5,
      center: 0,
      size: 11,
      ticks: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
    });
  });

  it("formats positive scale values with a sign", () => {
    expect(formatCoordinateTick(-2)).toBe("-2");
    expect(formatCoordinateTick(0)).toBe("0");
    expect(formatCoordinateTick(2)).toBe("+2");
  });
});
