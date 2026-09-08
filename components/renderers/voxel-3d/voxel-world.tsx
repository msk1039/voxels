"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { GridSpec } from "@/lib/grid";

import { createClayTexture } from "./clay-texture";
import { CoordinateGuide } from "./coordinate-guide";
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
  onHover: (hovered: HoveredVoxel | null) => void;
}

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
  onHover,
}: VoxelWorldProps) {
  const reduceMotion = useReducedMotion();
  const cameraTimer = useRef<number | null>(null);
  const lastCameraSync = useRef(0);
  const cameraPosition = useRef(new Vector3());
  const cameraTarget = useRef(new Vector3());
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
      <color attach="background" args={["#e8edf0"]} />
      <fog attach="fog" args={["#e8edf0", 24, 42]} />
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
      <CoordinateGuide grid={grid} showScale={interactive} />
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
