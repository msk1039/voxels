"use client";

import { useEffect, useMemo } from "react";
import { CameraControls } from "@react-three/drei";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

import { createClayTexture } from "./clay-texture";
import {
  HoveredVoxel,
  RenderQuality,
  VoxelGroup,
  VoxelTransition,
} from "./types";
import { VoxelInstances } from "./voxel-instances";
import { WorldLighting } from "./world-lighting";

interface VoxelWorldProps {
  controlsRef: React.RefObject<CameraControls | null>;
  groups: VoxelGroup[];
  quality: RenderQuality;
  interactive?: boolean;
  transition?: VoxelTransition;
  onHover: (hovered: HoveredVoxel | null) => void;
}

export function VoxelWorld({
  controlsRef,
  groups,
  quality,
  interactive = true,
  transition,
  onHover,
}: VoxelWorldProps) {
  const reduceMotion = useReducedMotion();
  const geometry = useMemo(
    () => new RoundedBoxGeometry(0.86, 0.86, 0.86, quality === "high" ? 4 : 2, 0.085),
    [quality]
  );
  const detailTexture = useMemo(
    () => (quality === "high" ? createClayTexture(64) : undefined),
    [quality]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => detailTexture?.dispose(), [detailTexture]);

  return (
    <>
      <color attach="background" args={["#e8edf0"]} />
      <fog attach="fog" args={["#e8edf0", 24, 42]} />
      <CameraControls
        ref={controlsRef}
        makeDefault
        enabled={interactive}
        smoothTime={reduceMotion ? 0 : 0.18}
        minDistance={9}
        maxDistance={34}
        minPolarAngle={0.08}
        maxPolarAngle={Math.PI / 2.03}
      />
      <WorldLighting quality={quality} />
      {groups.map((group) => (
        <VoxelInstances
          key={`${group.id}:${group.cells.length}`}
          group={group}
          geometry={geometry}
          detailTexture={detailTexture}
          quality={quality}
          reduceMotion={reduceMotion}
          transition={transition}
          leaving={group.id === "leaving"}
          onHover={onHover}
        />
      ))}
    </>
  );
}
