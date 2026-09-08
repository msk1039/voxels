import { Cell, CellTransitionDiff } from "@/lib/grid";

export type RenderQuality = "high" | "reduced";

export interface VoxelGroup {
  id: string;
  cells: Cell[];
  appearance: "material" | "correct" | "missing" | "extra" | "wrong";
  label: string;
  ghost?: boolean;
}

export interface HoveredVoxel {
  cell: Cell;
  label: string;
}

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface VoxelTransition extends CellTransitionDiff {
  id: number;
}
