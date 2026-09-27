import { EquationMode } from "@/lib/equation";

/** Block and background colour for each chapter on the world map. */
export interface ChapterTheme {
  block: number;
  tint: string;
}

export const CHAPTER_THEMES: Readonly<Record<EquationMode, readonly ChapterTheme[]>> = {
  "2d": [
    { block: 4, tint: "#2f4a24" },
    { block: 3, tint: "#5a4a24" },
    { block: 5, tint: "#1f4639" },
    { block: 6, tint: "#253a58" },
  ],
  "3d": [
    { block: 7, tint: "#34284a" },
    { block: 2, tint: "#4d2a28" },
    { block: 5, tint: "#1d3f4a" },
    { block: 8, tint: "#4a2a40" },
  ],
};
