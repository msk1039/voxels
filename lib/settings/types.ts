export type GraphicsQuality = "auto" | "high" | "reduced";

export interface SettingsState {
  schemaVersion: 1;
  graphicsQuality: GraphicsQuality;
}
