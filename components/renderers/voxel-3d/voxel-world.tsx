"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, Group, Vector3 } from "three";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { GridSpec, coordinateKey } from "@/lib/grid";

import { BlockBurst } from "./block-burst";
import { CoordinateGuide } from "./coordinate-guide";
import { SKY_COLORS, SkyDome } from "./sky-dome";
import {
  CameraPose,
  HoveredVoxel,
  RenderQuality,
  VoxelGroup,
  VoxelTransition,
} from "./types";
import { VoxelInstances } from "./voxel-instances";
import { WorldLighting } from "./world-lighting";

const CAMERA_SYNC_INTERVAL_MS = 1000 / 30;

interface VoxelWorldProps {
  controlsRef: React.RefObject<CameraControls | null>;
  grid: GridSpec;
  groups: VoxelGroup[];
  quality: RenderQuality;
  interactive?: boolean;
  cameraPose?: CameraPose;
  onCameraChange?: (pose: CameraPose) => void;
  onRenderStart?: () => void;
  onRenderStop?: () => void;
  transition?: VoxelTransition;
  /** Slowly orbit the camera, for attract mode. */
  autoRotate?: boolean;
  animateTransitions: boolean;
  /** A non-zero id throws a burst of block shards; a new id throws another. */
  burstId?: number;
  onHover: (hovered: HoveredVoxel | null) => void;
}

/** Radians per second for attract-mode orbiting. */
const AUTO_ROTATE_SPEED = 0.18;

export function VoxelWorld({
  controlsRef,
  grid,
  groups,
  quality,
  interactive = true,
  cameraPose,
  onCameraChange,
  onRenderStart,
  onRenderStop,
  transition,
  autoRotate = false,
  animateTransitions,
  burstId = 0,
  onHover,
}: VoxelWorldProps) {
  const reduceMotion = useReducedMotion();
  const cameraTimer = useRef<number | null>(null);
  const lastCameraSync = useRef(0);
  const cameraPosition = useRef(new Vector3());
  const cameraTarget = useRef(new Vector3());
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  // Solid blocks shade their neighbours. Glass ghosts and blocks that are
  // on their way out do not.
  const solidKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const group of groups) {
      if (group.ghost || group.id === "leaving") continue;
      for (const cell of group.cells) keys.add(coordinateKey(cell));
    }
    return keys;
  }, [groups]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  const burstCells = useMemo(
    () => groups.filter((group) => !group.ghost).flatMap((group) => group.cells),
    [groups]
  );

  // Attract mode spins the world rather than the camera, so camera
  // controls stay asleep and do not toggle the render loop every frame.
  const spin = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!autoRotate || reduceMotion || !spin.current) return;
    // Cap delta so a paused tab does not jump the scene on resume.
    spin.current.rotation.y += Math.min(delta, 0.1) * AUTO_ROTATE_SPEED;
  });
  useEffect(() => {
    if (!cameraPose) return;
    void controlsRef.current?.setLookAt(
      ...cameraPose.position,
      ...cameraPose.target,
      false
    );
  }, [cameraPose, controlsRef]);
  useEffect(
    () => () => {
      if (cameraTimer.current !== null) {
        window.clearTimeout(cameraTimer.current);
      }
    },
    []
  );

  const emitCameraPose = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls || !onCameraChange) return;
    controls.getPosition(cameraPosition.current);
    controls.getTarget(cameraTarget.current);
    onCameraChange({
      position: cameraPosition.current.toArray(),
      target: cameraTarget.current.toArray(),
    });
  }, [controlsRef, onCameraChange]);

  const handleCameraChange = useCallback(() => {
    if (!onCameraChange || cameraTimer.current !== null) return;

    const now = window.performance.now();
    const remaining = CAMERA_SYNC_INTERVAL_MS - (now - lastCameraSync.current);
    if (remaining <= 0) {
      lastCameraSync.current = now;
      emitCameraPose();
      return;
    }

    cameraTimer.current = window.setTimeout(() => {
      cameraTimer.current = null;
      lastCameraSync.current = window.performance.now();
      emitCameraPose();
    }, remaining);
  }, [emitCameraPose, onCameraChange]);

  const handleCameraRest = useCallback(() => {
    if (!onCameraChange) return;
    if (cameraTimer.current !== null) {
      window.clearTimeout(cameraTimer.current);
      cameraTimer.current = null;
    }
    lastCameraSync.current = window.performance.now();
    emitCameraPose();
  }, [emitCameraPose, onCameraChange]);

  return (
    <>
      <color attach="background" args={[SKY_COLORS.horizon]} />
      <SkyDome />
      <CameraControls
        ref={controlsRef}
        makeDefault
        enabled={interactive}
        onChange={onCameraChange ? handleCameraChange : undefined}
        onControlStart={onRenderStart}
        onControl={onRenderStart}
        onTransitionStart={onRenderStart}
        onWake={onRenderStart}
        onRest={handleCameraRest}
        onSleep={onRenderStop}
        smoothTime={reduceMotion ? 0 : 0.18}
        minDistance={9}
        maxDistance={34}
        minPolarAngle={0.08}
        maxPolarAngle={Math.PI / 2.03}
      />
      <WorldLighting quality={quality} />
      <group ref={spin}>
        <CoordinateGuide grid={grid} showScale={interactive && !autoRotate} />
        {groups.map((group) => (
          <VoxelInstances
            key={`${group.id}:${group.cells.length}`}
            group={group}
            geometry={geometry}
            solidKeys={solidKeys}
            quality={quality}
            animateTransitions={animateTransitions}
            transition={transition}
            leaving={group.id === "leaving"}
            onHover={onHover}
          />
        ))}
        {burstId > 0 && !reduceMotion ? (
          <BlockBurst key={burstId} burstId={burstId} cells={burstCells} />
        ) : null}
      </group>
    </>
  );
}
