export const MATERIAL_COLORS: Readonly<Record<number, string>> = {
  1: "#e7a65e",
  2: "#dc7468",
  3: "#dfbd59",
  4: "#76ad78",
  5: "#64aaa5",
  6: "#6f98c8",
  7: "#9380bd",
  8: "#cc82a5",
};

export const MATCH_COLORS = {
  correct: "#63a97d",
  missing: "#5d8fc1",
  extra: "#d26870",
  wrongMaterial: "#9a74b7",
} as const;

export function getMaterialColor(material: number) {
  return MATERIAL_COLORS[material] ?? MATERIAL_COLORS[1];
}
