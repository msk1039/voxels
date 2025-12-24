"use client";

import { VoxelData } from "./types";
import { COLORS, DEFAULT_COLOR } from "./constants";

interface TooltipProps {
  voxel: VoxelData | null;
  position: { x: number; y: number } | null;
}

export function Tooltip({ voxel, position }: TooltipProps) {
  if (!voxel || !position) return null;

  const color = voxel.colorNum === 0 ? DEFAULT_COLOR : COLORS[voxel.colorNum];

  return (
    <div
      className="fixed z-50 pointer-events-none bg-gray-900/90 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-mono backdrop-blur-sm border border-gray-700"
      style={{
        left: position.x + 15,
        top: position.y + 15,
        transform: "translateY(-50%)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded"
          style={{ backgroundColor: color }}
        />
        <span>
          ({voxel.pos[0]}, {voxel.pos[1]}, {voxel.pos[2]})
        </span>
      </div>
    </div>
  );
}
