import { Cell } from "@/lib/grid";

export const VOXEL_TRANSITION_MS = 1050;

const EXIT_STAGGER = 0.22;
const EXIT_DURATION = 0.28;
const ENTRY_START = 0.5;
const ENTRY_STAGGER = 0.2;
const ENTRY_DURATION = 0.3;

function distanceFromOrigin(cell: Cell) {
  return Math.sqrt(cell.x * cell.x + cell.y * cell.y + cell.z * cell.z);
}

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function distanceRatio(cell: Cell, maximum: number) {
  if (maximum === 0) return 0;
  return distanceFromOrigin(cell) / maximum;
}

export function exitingVoxelScale(
  elapsed: number,
  cell: Cell,
  maximumDistance: number
) {
  const delay = (1 - distanceRatio(cell, maximumDistance)) * EXIT_STAGGER;
  const progress = clampProgress((elapsed - delay) / EXIT_DURATION);
  return 1 - easeOutCubic(progress);
}

export function enteringVoxelScale(
  elapsed: number,
  cell: Cell,
  maximumDistance: number
) {
  const delay =
    ENTRY_START + distanceRatio(cell, maximumDistance) * ENTRY_STAGGER;
  const progress = clampProgress((elapsed - delay) / ENTRY_DURATION);
  return easeOutCubic(progress);
}

const SCALE_STEPS = 4;

/**
 * Snaps an animated scale to a few steps so blocks pop in and out like
 * they are being placed, instead of easing smoothly.
 */
export function quantizeVoxelScale(amount: number, direction: "in" | "out") {
  if (amount >= 1) return 1;
  if (amount <= 0) return 0;
  const stepped =
    direction === "in"
      ? Math.floor(amount * SCALE_STEPS) / SCALE_STEPS
      : Math.ceil(amount * SCALE_STEPS) / SCALE_STEPS;
  return stepped;
}
