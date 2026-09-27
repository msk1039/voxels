import { describe, expect, it } from "vitest";

import { calculateRenderDpr } from "@/components/renderers/voxel-3d/render-resolution";

describe("render resolution", () => {
  it("applies the selected render scale independently", () => {
    const base = {
      devicePixelRatio: 2,
      mobile: false,
      preview: false,
      performanceReduced: false,
    };

    expect(calculateRenderDpr({ ...base, renderScale: "full" })).toBeCloseTo(
      1.5
    );
    expect(
      calculateRenderDpr({ ...base, renderScale: "balanced" })
    ).toBeCloseTo(1.2);
    expect(
      calculateRenderDpr({ ...base, renderScale: "performance" })
    ).toBeCloseTo(0.975);
  });

  it("only reduces automatic resolution after a performance decline", () => {
    const base = {
      devicePixelRatio: 2,
      mobile: false,
      preview: false,
      renderScale: "auto" as const,
    };

    expect(
      calculateRenderDpr({ ...base, performanceReduced: false })
    ).toBeCloseTo(1.5);
    expect(
      calculateRenderDpr({ ...base, performanceReduced: true })
    ).toBeCloseTo(1.2);
  });

  it("retains mobile and target-preview DPR caps", () => {
    expect(
      calculateRenderDpr({
        devicePixelRatio: 3,
        mobile: true,
        preview: false,
        renderScale: "full",
        performanceReduced: false,
      })
    ).toBe(1);
    expect(
      calculateRenderDpr({
        devicePixelRatio: 3,
        mobile: false,
        preview: true,
        renderScale: "full",
        performanceReduced: false,
      })
    ).toBe(1);
  });

  it("renders chunky pixels in retro mode, but not in previews", () => {
    const options = {
      devicePixelRatio: 2,
      mobile: false,
      preview: false,
      renderScale: "full" as const,
      performanceReduced: false,
    };
    expect(calculateRenderDpr({ ...options, pixelSize: "3" })).toBeCloseTo(1 / 3);
    expect(calculateRenderDpr({ ...options, pixelSize: "2" })).toBeCloseTo(0.5);
    expect(
      calculateRenderDpr({ ...options, preview: true, pixelSize: "3" })
    ).toBeCloseTo(1);
  });
});
