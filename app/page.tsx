"use client";

import { useState, useCallback } from "react";
import { Scene, CodeInput, Tooltip, DEFAULT_EQUATION, VoxelData } from "./components";

export default function Home() {
  const [equation, setEquation] = useState(DEFAULT_EQUATION);
  const [version, setVersion] = useState(0);
  const [hoveredVoxel, setHoveredVoxel] = useState<VoxelData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handleEquationChange = useCallback((newEquation: string) => {
    setEquation(newEquation);
    setVersion((v) => v + 1);
  }, []);

  const handleHover = useCallback(
    (voxel: VoxelData | null, screenPos: { x: number; y: number } | null) => {
      setHoveredVoxel(voxel);
      setTooltipPos(screenPos);
    },
    []
  );

  return (
    <div className="w-screen h-screen bg-gray-100 relative">
      <CodeInput value={equation} onChange={handleEquationChange} />
      <Scene equation={equation} version={version} onHover={handleHover} />
      <Tooltip voxel={hoveredVoxel} position={tooltipPos} />
    </div>
  );
}
