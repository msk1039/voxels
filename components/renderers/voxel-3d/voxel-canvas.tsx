"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { RotateCcw, Scan, Square, View } from "lucide-react";
import { NoToneMapping, SRGBColorSpace } from "three";

import { useSettings } from "@/components/settings/settings-provider";
import { Button } from "@/components/ui/button";
import { useDevicePixelRatio } from "@/hooks/use-device-pixel-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useRenderVisibility } from "@/hooks/use-render-visibility";
import { getBlock } from "@/lib/blocks";
import { CellMap, GridSpec } from "@/lib/grid";
import { cn } from "@/lib/utils";

import { GridView } from "../grid-2d/grid-2d-renderer";
import { ActivityFrameLoop } from "./activity-frame-loop";
import { calculateRenderDpr } from "./render-resolution";
import {
  CameraPose,
  HoveredVoxel,
  RenderQuality,
  VoxelTransition,
} from "./types";
import { createVoxelGroups } from "./voxel-groups";
import { BURST_DURATION_S } from "./block-burst";
import { VOXEL_TRANSITION_MS } from "./voxel-transition";
import { VoxelWorld } from "./voxel-world";

interface VoxelCanvasProps {
  grid: GridSpec;
  target: CellMap;
  actual: CellMap;
  view: GridView;
  hasRun: boolean;
  transition?: VoxelTransition;
  onTransitionComplete?: (id: number) => void;
  preview?: boolean;
  showInteractionHint?: boolean;
  cameraPose?: CameraPose;
  onCameraChange?: (pose: CameraPose) => void;
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
  /** Attract mode: spin the world, hide the camera toolbar, cap quality. */
  autoRotate?: boolean;
  /** Change to a new non-zero id to throw a celebratory block burst. */
  burstId?: number;
  className?: string;
}

const DEFAULT_CAMERA = {
  position: [16, 13, 16] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
};

export function VoxelCanvas({
  grid,
  target,
  actual,
  view,
  hasRun,
  transition,
  onTransitionComplete,
  preview = false,
  showInteractionHint = true,
  cameraPose,
  onCameraChange,
  camera = DEFAULT_CAMERA,
  autoRotate = false,
  burstId = 0,
  className,
}: VoxelCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const controls = useRef<CameraControls>(null);
  const { settings } = useSettings();
  const mobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const devicePixelRatio = useDevicePixelRatio();
  const [performanceReduced, setPerformanceReduced] = useState(false);
  const [hovered, setHovered] = useState<HoveredVoxel | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [burstingId, setBurstingId] = useState(0);
  const visible = useRenderVisibility(container);
  const baseGroups = useMemo(
    () => createVoxelGroups(target, actual, view, hasRun),
    [actual, hasRun, target, view]
  );
  const groups = useMemo(() => {
    if (!transition || transition.leaving.length === 0 || view === "target") {
      return baseGroups;
    }
    return [
      ...baseGroups,
      {
        id: "leaving",
        cells: transition.leaving,
        appearance: "material" as const,
        label: "Previous result",
      },
    ];
  }, [baseGroups, transition, view]);

  let quality: RenderQuality;
  if (preview || autoRotate) quality = "reduced";
  else if (settings.graphicsQuality === "high") quality = "high";
  else if (settings.graphicsQuality === "reduced") quality = "reduced";
  else quality = mobile || performanceReduced ? "reduced" : "high";

  const renderDpr = calculateRenderDpr({
    devicePixelRatio,
    mobile,
    preview,
    renderScale: settings.renderScale,
    performanceReduced,
    pixelSize: settings.pixelSize,
  });
  const pixelated = settings.pixelSize !== "off" && !preview;
  const spinning = autoRotate && !reduceMotion;
  const activeFrameRate =
    settings.frameRate === "30" || spinning ? 30 : 60;
  // Block pops cost a matrix update per block per frame, so they only run
  // on high quality, or while attract mode keeps the loop running anyway.
  const animateTransitions = !reduceMotion && (quality === "high" || spinning);
  const animatedTransition = Boolean(transition) && animateTransitions;
  const bursting = burstingId !== 0 && burstingId === burstId && !reduceMotion;
  const renderActive =
    cameraActive || animatedTransition || spinning || bursting;
  const renderSignal = useMemo(
    () => ({
      cameraPose,
      grid,
      groups,
      hasRun,
      quality,
      renderDpr,
      transition,
      view,
    }),
    [
      cameraPose,
      grid,
      groups,
      hasRun,
      quality,
      renderDpr,
      transition,
      view,
    ]
  );
  const beginCameraRender = useCallback(() => setCameraActive(true), []);
  const endCameraRender = useCallback(() => setCameraActive(false), []);

  // Keep the render loop running while a burst is in the air.
  useEffect(() => {
    if (burstId === 0 || reduceMotion) return;
    const start = window.setTimeout(() => setBurstingId(burstId), 0);
    const stop = window.setTimeout(
      () => setBurstingId(0),
      BURST_DURATION_S * 1000 + 100
    );
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [burstId, reduceMotion]);

  useEffect(() => {
    if (!transition || !onTransitionComplete) return;
    if (!animateTransitions) {
      const frame = window.requestAnimationFrame(() =>
        onTransitionComplete(transition.id)
      );
      return () => window.cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(
      () => onTransitionComplete(transition.id),
      VOXEL_TRANSITION_MS
    );
    return () => window.clearTimeout(timer);
  }, [animateTransitions, onTransitionComplete, transition]);

  function moveCamera(position: [number, number, number]) {
    void controls.current?.setLookAt(
      ...position,
      ...camera.target,
      true
    );
  }

  return (
    <div
      ref={container}
      className={cn(
        "relative h-full overflow-hidden bg-sky",
        preview || autoRotate ? "min-h-0" : "min-h-[420px]",
        className
      )}
    >
      <Canvas
        style={{
          position: "absolute",
          inset: 0,
          imageRendering: pixelated ? "pixelated" : undefined,
        }}
        dpr={renderDpr}
        frameloop="never"
        camera={{
          position: camera.position,
          fov: 34,
          near: 0.1,
          far: 160,
        }}
        shadows={quality === "high"}
        gl={{
          antialias: !pixelated,
          alpha: false,
          outputColorSpace: SRGBColorSpace,
          // Block textures are authored in display colours; tone mapping
          // would wash them out.
          toneMapping: NoToneMapping,
        }}
        aria-label={`${view} three-dimensional voxel grid from ${grid.min} to ${grid.max}`}
      >
        <ActivityFrameLoop
          active={renderActive}
          fps={activeFrameRate}
          renderSignal={renderSignal}
          visible={visible}
        />
        {!preview &&
        !autoRotate &&
        (settings.graphicsQuality === "auto" ||
          settings.renderScale === "auto") &&
        !mobile ? (
          <PerformanceMonitor
            flipflops={2}
            onDecline={() => setPerformanceReduced(true)}
            onIncline={() => setPerformanceReduced(false)}
            onFallback={() => setPerformanceReduced(true)}
          />
        ) : null}
        <VoxelWorld
          controlsRef={controls}
          grid={grid}
          groups={groups}
          quality={quality}
          interactive={!preview}
          cameraPose={cameraPose}
          onCameraChange={onCameraChange}
          onRenderStart={beginCameraRender}
          onRenderStop={endCameraRender}
          transition={transition}
          autoRotate={spinning}
          animateTransitions={animateTransitions}
          burstId={bursting ? burstId : 0}
          onHover={setHovered}
        />
      </Canvas>

      {!preview && !autoRotate ? (
        <div className="pointer-events-none absolute top-0 right-0 p-3">
          <div className="pointer-events-auto flex items-center gap-1 pixel-panel p-1">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Reset camera"
              aria-label="Reset camera"
              onClick={() => moveCamera(camera.position)}
            >
              <RotateCcw aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Front view"
              aria-label="Front view"
              onClick={() => moveCamera([0, 0, 20])}
            >
              <Square aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Side view"
              aria-label="Side view"
              onClick={() => moveCamera([20, 0, 0])}
            >
              <View aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Top view"
              aria-label="Top view"
              onClick={() => moveCamera([0, 20, 0.01])}
            >
              <Scan aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      {!preview && !autoRotate && showInteractionHint ? (
        <div className="pointer-events-none absolute bottom-3 left-3 pixel-panel px-2.5 py-1.5 text-sm text-muted-foreground">
          {hovered
            ? `${hovered.label}: (${hovered.cell.x}, ${hovered.cell.y}, ${hovered.cell.z}) · ${getBlock(hovered.cell.material).name}`
            : quality === "high"
              ? "Drag to rotate · scroll to zoom · hover for coordinates"
              : "Drag to rotate · scroll to zoom"}
        </div>
      ) : null}
    </div>
  );
}
