"use client";

import { useFrame, ThreeEvent } from "@react-three/fiber";
import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { VoxelData, AnimationPhase } from "./types";
import { COLORS, DEFAULT_COLOR } from "./constants";
import { easeOutBack, easeInBack } from "./utils/easing";

interface AnimatedVoxelsProps {
  voxels: VoxelData[];
  phase: AnimationPhase;
  onComplete: () => void;
  onHover?: (voxel: VoxelData | null, screenPos: { x: number; y: number } | null) => void;
}

export function AnimatedVoxels({ voxels, phase, onComplete, onHover }: AnimatedVoxelsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startTime = useRef<number | null>(null);
  const completed = useRef(false);

  const maxDist = useMemo(
    () => Math.max(...voxels.map((v) => v.dist), 1),
    [voxels]
  );

  // Set colors when voxels change
  useEffect(() => {
    if (!meshRef.current || voxels.length === 0) return;

    const color = new THREE.Color();
    voxels.forEach((voxel, i) => {
      color.set(voxel.colorNum === 0 ? DEFAULT_COLOR : COLORS[voxel.colorNum]);
      meshRef.current!.setColorAt(i, color);
    });
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [voxels]);

  // Reset animation state on phase change
  useEffect(() => {
    startTime.current = null;
    completed.current = false;
  }, [phase, voxels]);

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!onHover || voxels.length === 0) return;
      
      e.stopPropagation();
      
      if (e.instanceId !== undefined && e.instanceId < voxels.length) {
        const voxel = voxels[e.instanceId];
        onHover(voxel, { x: e.clientX, y: e.clientY });
      }
    },
    [voxels, onHover]
  );

  const handlePointerOut = useCallback(() => {
    if (onHover) {
      onHover(null, null);
    }
  }, [onHover]);

  useFrame((state) => {
    if (!meshRef.current || voxels.length === 0 || completed.current) return;

    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTime.current;
    const duration = 0.5;
    const staggerTime = 0.3;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();

    let allDone = true;

    voxels.forEach((voxel, i) => {
      const normalizedDist = voxel.dist / maxDist;

      let delay: number;
      let progress: number;
      let scaleValue: number;

      if (phase === "enter") {
        delay = normalizedDist * staggerTime;
        const t = Math.max(0, elapsed - delay) / duration;
        progress = Math.min(1, t);
        scaleValue = easeOutBack(progress);
      } else {
        // Exit: outer first, inner last
        delay = (1 - normalizedDist) * staggerTime;
        const t = Math.max(0, elapsed - delay) / duration;
        progress = Math.min(1, t);
        scaleValue = 1 - easeInBack(progress);
      }

      if (progress < 1) allDone = false;

      position.set(voxel.pos[0], voxel.pos[1], voxel.pos[2]);
      const s = Math.max(0.001, scaleValue);
      scale.set(s, s, s);
      quaternion.identity();
      matrix.compose(position, quaternion, scale);
      meshRef.current!.setMatrixAt(i, matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (allDone && !completed.current) {
      completed.current = true;
      onComplete();
    }
  });

  if (voxels.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, voxels.length]}
      castShadow
      receiveShadow
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[0.85, 0.85, 0.85]} />
      <meshStandardMaterial roughness={0.5} metalness={0.1} />
    </instancedMesh>
  );
}
