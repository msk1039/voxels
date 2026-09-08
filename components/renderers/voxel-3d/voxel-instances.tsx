"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import {
  Color,
  Euler,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  DataTexture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { MATCH_COLORS, getMaterialColor } from "@/lib/materials";
import { coordinateKey } from "@/lib/grid";

import { StylizedVoxelMaterial } from "./stylized-voxel-material";
import {
  HoveredVoxel,
  RenderQuality,
  VoxelGroup,
  VoxelTransition,
} from "./types";
import {
  enteringVoxelScale,
  exitingVoxelScale,
} from "./voxel-transition";

interface VoxelInstancesProps {
  group: VoxelGroup;
  geometry: RoundedBoxGeometry;
  detailTexture?: DataTexture;
  quality: RenderQuality;
  reduceMotion: boolean;
  transition?: VoxelTransition;
  leaving?: boolean;
  onHover: (hovered: HoveredVoxel | null) => void;
}

const matrix = new Matrix4();
const position = new Vector3();
const scale = new Vector3();
const rotation = new Quaternion().setFromEuler(new Euler(0, 0, 0));
const color = new Color();

function colorFor(group: VoxelGroup, index: number) {
  const cell = group.cells[index];
  switch (group.appearance) {
    case "material":
      return getMaterialColor(cell.material);
    case "correct":
      return MATCH_COLORS.correct;
    case "missing":
      return MATCH_COLORS.missing;
    case "extra":
      return MATCH_COLORS.extra;
    case "wrong":
      return MATCH_COLORS.wrongMaterial;
  }
}

export function VoxelInstances({
  group,
  geometry,
  detailTexture,
  quality,
  reduceMotion,
  transition,
  leaving = false,
  onHover,
}: VoxelInstancesProps) {
  const mesh = useRef<InstancedMesh>(null);
  const animationStart = useRef<number | null>(null);
  const animate = Boolean(transition) && !reduceMotion && quality === "high";
  const animationDone = useRef(!animate);
  const instanceColors = useMemo(() => {
    const values = new Float32Array(group.cells.length * 3);
    group.cells.forEach((_, index) => {
      color.set(colorFor(group, index)).toArray(values, index * 3);
    });
    return new InstancedBufferAttribute(values, 3);
  }, [group]);

  useLayoutEffect(() => {
    const current = mesh.current;
    if (!current) return;

    group.cells.forEach((cell, index) => {
      const entering = transition?.enteringKeys.has(coordinateKey(cell));
      const initialScale = animate && entering && !leaving ? 0.001 : 1;
      position.set(cell.x, cell.y, cell.z);
      scale.setScalar(initialScale);
      matrix.compose(position, rotation, scale);
      current.setMatrixAt(index, matrix);
    });
    current.instanceMatrix.needsUpdate = true;
    current.computeBoundingSphere();
    animationStart.current = null;
    animationDone.current = !animate;
  }, [animate, group, leaving, transition]);

  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current || animationDone.current) return;

    const now = clock.getElapsedTime();
    animationStart.current ??= now;
    const elapsed = now - animationStart.current;
    let complete = true;

    group.cells.forEach((cell, index) => {
      const entering = transition?.enteringKeys.has(coordinateKey(cell));
      let amount = 1;
      if (leaving && transition) {
        amount = exitingVoxelScale(
          elapsed,
          cell,
          transition.maxLeavingDistance
        );
        if (amount > 0) complete = false;
      } else if (entering && transition) {
        amount = enteringVoxelScale(
          elapsed,
          cell,
          transition.maxEnteringDistance
        );
        if (amount < 1) complete = false;
      }
      position.set(cell.x, cell.y, cell.z);
      scale.setScalar(Math.max(0.001, amount));
      matrix.compose(position, rotation, scale);
      current.setMatrixAt(index, matrix);
    });
    current.instanceMatrix.needsUpdate = true;
    if (complete) animationDone.current = true;
  });

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (event.instanceId === undefined) return;
    event.stopPropagation();
    onHover({ cell: group.cells[event.instanceId], label: group.label });
  }

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, group.cells.length]}
      instanceColor={instanceColors}
      castShadow={!group.ghost}
      receiveShadow={!group.ghost}
      dispose={null}
      onPointerMove={quality === "high" ? handlePointerMove : undefined}
      onPointerOut={quality === "high" ? () => onHover(null) : undefined}
    >
      <StylizedVoxelMaterial
        detailTexture={detailTexture}
        ghost={group.ghost}
      />
    </instancedMesh>
  );
}
