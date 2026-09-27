"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  Euler,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";

import { coordinateKey } from "@/lib/grid";

import { BlockMaterial } from "./block-material";
import { computeNeighborMask } from "./neighbor-mask";
import {
  HoveredVoxel,
  RenderQuality,
  VoxelGroup,
  VoxelTransition,
} from "./types";
import {
  enteringVoxelScale,
  exitingVoxelScale,
  quantizeVoxelScale,
} from "./voxel-transition";

interface VoxelInstancesProps {
  group: VoxelGroup;
  geometry: BoxGeometry;
  /** Keys of every solid block in the scene, for ambient occlusion. */
  solidKeys: ReadonlySet<string>;
  quality: RenderQuality;
  /** Whether block pop animations play, decided by the canvas. */
  animateTransitions: boolean;
  transition?: VoxelTransition;
  leaving?: boolean;
  onHover: (hovered: HoveredVoxel | null) => void;
}

const matrix = new Matrix4();
const position = new Vector3();
const scale = new Vector3();
const rotation = new Quaternion().setFromEuler(new Euler(0, 0, 0));

export function VoxelInstances({
  group,
  geometry,
  solidKeys,
  quality,
  animateTransitions,
  transition,
  leaving = false,
  onHover,
}: VoxelInstancesProps) {
  const mesh = useRef<InstancedMesh>(null);
  const animationStart = useRef<number | null>(null);
  const animate = Boolean(transition) && animateTransitions;
  const animationDone = useRef(!animate);
  const blockAttribute = useMemo(
    () =>
      new InstancedBufferAttribute(
        Float32Array.from(group.cells, (cell) => cell.material),
        1
      ),
    [group]
  );
  const neighborAttribute = useMemo(() => {
    const values = new Float32Array(group.cells.length * 2);
    // Ghost blocks are see-through glass and stay unshaded.
    if (!group.ghost) {
      group.cells.forEach((cell, index) => {
        values.set(computeNeighborMask(cell, solidKeys), index * 2);
      });
    }
    return new InstancedBufferAttribute(values, 2);
  }, [group, solidKeys]);
  // Instanced attributes live on the geometry, so each mesh gets its own
  // copy of the shared 24-vertex box.
  const instancedGeometry = useMemo(() => {
    const copy = geometry.clone();
    copy.setAttribute("aBlock", blockAttribute);
    copy.setAttribute("aNeighbors", neighborAttribute);
    return copy;
  }, [blockAttribute, geometry, neighborAttribute]);

  useEffect(() => () => instancedGeometry.dispose(), [instancedGeometry]);

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
  }, [animate, group, instancedGeometry, leaving, transition]);

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
        amount = quantizeVoxelScale(
          exitingVoxelScale(elapsed, cell, transition.maxLeavingDistance),
          "out"
        );
        if (amount > 0) complete = false;
      } else if (entering && transition) {
        amount = quantizeVoxelScale(
          enteringVoxelScale(elapsed, cell, transition.maxEnteringDistance),
          "in"
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
      args={[undefined, undefined, group.cells.length]}
      geometry={instancedGeometry}
      castShadow={quality === "high" && !group.ghost}
      receiveShadow={quality === "high" && !group.ghost}
      dispose={null}
      onPointerMove={quality === "high" ? handlePointerMove : undefined}
      onPointerOut={quality === "high" ? () => onHover(null) : undefined}
    >
      <BlockMaterial
        key={group.appearance}
        appearance={group.appearance}
        ghost={group.ghost}
        quality={quality}
      />
    </instancedMesh>
  );
}
