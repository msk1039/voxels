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

import { StylizedVoxelMaterial } from "./stylized-voxel-material";
import { HoveredVoxel, RenderQuality, VoxelGroup } from "./types";

interface VoxelInstancesProps {
  group: VoxelGroup;
  geometry: RoundedBoxGeometry;
  detailTexture?: DataTexture;
  quality: RenderQuality;
  reduceMotion: boolean;
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

function constructionScale(elapsed: number, delay: number) {
  const progress = Math.min(1, Math.max(0, (elapsed - delay) / 0.32));
  return 1 - Math.pow(1 - progress, 3);
}

export function VoxelInstances({
  group,
  geometry,
  detailTexture,
  quality,
  reduceMotion,
  onHover,
}: VoxelInstancesProps) {
  const mesh = useRef<InstancedMesh>(null);
  const animationStart = useRef<number | null>(null);
  const animationDone = useRef(reduceMotion || quality === "reduced");
  const animate = !reduceMotion && quality === "high";
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

    const initialScale = animate ? 0.001 : 1;
    group.cells.forEach((cell, index) => {
      position.set(cell.x, cell.y, cell.z);
      scale.setScalar(initialScale);
      matrix.compose(position, rotation, scale);
      current.setMatrixAt(index, matrix);
    });
    current.instanceMatrix.needsUpdate = true;
    current.computeBoundingSphere();
    animationStart.current = null;
    animationDone.current = !animate;
  }, [animate, group]);

  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current || animationDone.current) return;

    const now = clock.getElapsedTime();
    animationStart.current ??= now;
    const elapsed = now - animationStart.current;
    let complete = true;

    group.cells.forEach((cell, index) => {
      const distance = Math.abs(cell.x) + Math.abs(cell.y) + Math.abs(cell.z);
      const delay = Math.min(0.24, distance * 0.012 + index * 0.0007);
      const amount = constructionScale(elapsed, delay);
      if (amount < 1) complete = false;
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
