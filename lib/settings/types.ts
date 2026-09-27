export type GraphicsQuality = "auto" | "high" | "reduced";
export type RenderScale = "auto" | "full" | "balanced" | "performance";
export type FrameRate = "auto" | "60" | "30";
export type PixelSize = "off" | "2" | "3";

export interface SettingsState {
  schemaVersion: 1;
  graphicsQuality: GraphicsQuality;
  renderScale: RenderScale;
  frameRate: FrameRate;
  /** Renders the 3D view at a fraction of its size for chunky pixels. */
  pixelSize: PixelSize;
  sound: boolean;
  /** Sound effect volume from 0 to 1. */
  volume: number;
}
