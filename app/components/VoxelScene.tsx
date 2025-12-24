"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatedVoxels } from "./AnimatedVoxels";
import { VoxelData, AnimationPhase } from "./types";
import { generateVoxels } from "./utils/voxelGenerator";

interface VoxelSceneProps {
  equation: string;
  version: number;
  onHover?: (voxel: VoxelData | null, screenPos: { x: number; y: number } | null) => void;
}

export function VoxelScene({ equation, version, onHover }: VoxelSceneProps) {
  const [displayVoxels, setDisplayVoxels] = useState<VoxelData[]>([]);
  const [phase, setPhase] = useState<AnimationPhase>("enter");
  const pendingEquation = useRef<string | null>(null);
  const isFirstRender = useRef(true);

  // Handle equation changes
  useEffect(() => {
    if (isFirstRender.current) {
      // First render: just show voxels
      isFirstRender.current = false;
      setDisplayVoxels(generateVoxels(equation));
      setPhase("enter");
    } else {
      // Subsequent changes: exit first, then enter
      if (displayVoxels.length > 0) {
        pendingEquation.current = equation;
        setPhase("exit");
      } else {
        setDisplayVoxels(generateVoxels(equation));
        setPhase("enter");
      }
    }
  }, [version]);

  const handleAnimationComplete = useCallback(() => {
    if (phase === "exit" && pendingEquation.current) {
      const newVoxels = generateVoxels(pendingEquation.current);
      pendingEquation.current = null;
      setDisplayVoxels(newVoxels);
      setPhase("enter");
    }
  }, [phase]);

  return (
    <AnimatedVoxels
      voxels={displayVoxels}
      phase={phase}
      onComplete={handleAnimationComplete}
      onHover={onHover}
    />
  );
}
