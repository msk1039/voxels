import { MATERIAL_COLORS } from "@/lib/materials";

/**
 * Each material number maps to a block. A block keeps the hue of its
 * material colour, because level text refers to materials by colour
 * ("a blue planet with a warm core").
 */
export type BlockPattern =
  | "planks"
  | "brick"
  | "sand"
  | "grass"
  | "prismarine"
  | "lapis"
  | "amethyst"
  | "wool";

export interface BlockType {
  material: number;
  name: string;
  hue: string;
  color: string;
  pattern: BlockPattern;
}

export const BLOCKS: readonly BlockType[] = [
  { material: 1, name: "Oak Planks", hue: "orange", pattern: "planks" },
  { material: 2, name: "Brick", hue: "red", pattern: "brick" },
  { material: 3, name: "Sand", hue: "yellow", pattern: "sand" },
  { material: 4, name: "Grass", hue: "green", pattern: "grass" },
  { material: 5, name: "Prismarine", hue: "teal", pattern: "prismarine" },
  { material: 6, name: "Lapis", hue: "blue", pattern: "lapis" },
  { material: 7, name: "Amethyst", hue: "purple", pattern: "amethyst" },
  { material: 8, name: "Cherry Wool", hue: "pink", pattern: "wool" },
].map((block) => ({ ...block, color: MATERIAL_COLORS[block.material] }) as BlockType);

export const BLOCK_COUNT = BLOCKS.length;

export function getBlock(material: number): BlockType {
  return BLOCKS[material - 1] ?? BLOCKS[0];
}
