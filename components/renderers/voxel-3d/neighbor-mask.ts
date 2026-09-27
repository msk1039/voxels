import { Cell, coordinateKey } from "@/lib/grid";

/**
 * Packs which of a block's 26 neighbours are solid into two floats of 13
 * bits each. The block shader reads the mask to bake Minecraft-style
 * corner ambient occlusion without any post-processing pass.
 *
 * Bit order: index = (dx+1)*9 + (dy+1)*3 + (dz+1), skipping the centre (13).
 * The shader in block-material.tsx uses the same order.
 */
export const NEIGHBOR_WORD_BITS = 13;

export function neighborBit(dx: number, dy: number, dz: number) {
  const index = (dx + 1) * 9 + (dy + 1) * 3 + (dz + 1);
  if (index === 13) throw new Error("The centre cell is not a neighbour.");
  return index > 13 ? index - 1 : index;
}

export function computeNeighborMask(
  cell: Pick<Cell, "x" | "y" | "z">,
  solid: ReadonlySet<string>,
  step = 1
): [number, number] {
  let low = 0;
  let high = 0;
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        const key = coordinateKey({
          x: cell.x + dx * step,
          y: cell.y + dy * step,
          z: cell.z + dz * step,
        });
        if (!solid.has(key)) continue;
        const bit = neighborBit(dx, dy, dz);
        if (bit < NEIGHBOR_WORD_BITS) low |= 1 << bit;
        else high |= 1 << (bit - NEIGHBOR_WORD_BITS);
      }
    }
  }
  return [low, high];
}

export function hasNeighbor(
  mask: readonly [number, number],
  dx: number,
  dy: number,
  dz: number
) {
  const bit = neighborBit(dx, dy, dz);
  const word = bit < NEIGHBOR_WORD_BITS ? mask[0] : mask[1];
  return ((word >> (bit % NEIGHBOR_WORD_BITS)) & 1) === 1;
}
