export type GraphicsQuality = "auto" | "high" | "reduced";
export type RenderScale = "auto" | "full" | "balanced" | "performance";
export type FrameRate = "auto" | "60" | "30";

export interface SettingsState {
  schemaVersion: 1;
  graphicsQuality: GraphicsQuality;
  renderScale: RenderScale;
  frameRate: FrameRate;
}
