import { PixelSize, RenderScale } from "@/lib/settings";

const RENDER_SCALE: Record<Exclude<RenderScale, "auto">, number> = {
  full: 1,
  balanced: 0.8,
  performance: 0.65,
};

interface RenderDprOptions {
  devicePixelRatio: number;
  mobile: boolean;
  preview: boolean;
  renderScale: RenderScale;
  performanceReduced: boolean;
  /** Retro mode: each rendered pixel covers this many CSS pixels. */
  pixelSize?: PixelSize;
}

export function calculateRenderDpr({
  devicePixelRatio,
  mobile,
  preview,
  renderScale,
  performanceReduced,
  pixelSize = "off",
}: RenderDprOptions) {
  if (pixelSize !== "off" && !preview) return 1 / Number(pixelSize);

  const scale =
    renderScale === "auto"
      ? performanceReduced
        ? RENDER_SCALE.balanced
        : RENDER_SCALE.full
      : RENDER_SCALE[renderScale];
  const deviceCap = mobile ? 1 : 1.5;
  const configuredDpr = Math.max(
    0.6,
    Math.min(devicePixelRatio, deviceCap) * scale
  );

  return preview ? Math.min(configuredDpr, 1) : configuredDpr;
}
