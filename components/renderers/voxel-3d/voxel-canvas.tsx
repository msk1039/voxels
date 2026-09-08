"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { RotateCcw, Scan, Square, View } from "lucide-react";
import { ToneMappingMode } from "postprocessing";
import { ACESFilmicToneMapping, NoToneMapping, SRGBColorSpace } from "three";

import { useSettings } from "@/components/settings/settings-provider";
import { Button } from "@/components/ui/button";
import { useDevicePixelRatio } from "@/hooks/use-device-pixel-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useRenderVisibility } from "@/hooks/use-render-visibility";
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
  if (preview) quality = "reduced";
  else if (settings.graphicsQuality === "high") quality = "high";
  else if (settings.graphicsQuality === "reduced") quality = "reduced";
  else quality = mobile || performanceReduced ? "reduced" : "high";

  const renderDpr = calculateRenderDpr({
    devicePixelRatio,
    mobile,
    preview,
    renderScale: settings.renderScale,
    performanceReduced,
  });
  const activeFrameRate =
    settings.frameRate === "30" ? 30 : 60;
  const animatedTransition =
    Boolean(transition) && !reduceMotion && quality === "high";
  const renderActive = cameraActive || animatedTransition;
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

  useEffect(() => {
    if (!transition || !onTransitionComplete) return;
    if (reduceMotion || quality === "reduced") {
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
  }, [onTransitionComplete, quality, reduceMotion, transition]);

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
        "relative h-full overflow-hidden bg-muted/20",
        preview ? "min-h-0" : "min-h-[420px]"
      )}
    >
      <Canvas
        style={{ position: "absolute", inset: 0 }}
        dpr={renderDpr}
        frameloop="never"
        camera={{
          position: camera.position,
          fov: 34,
          near: 0.1,
          far: 100,
        }}
        shadows={quality === "high"}
        gl={{
          antialias: quality === "reduced",
          alpha: false,
          outputColorSpace: SRGBColorSpace,
          toneMapping:
            quality === "high" ? NoToneMapping : ACESFilmicToneMapping,
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
          onHover={setHovered}
        />
        {!preview && quality === "high" ? (
          <EffectComposer multisampling={4}>
            <N8AO
              aoRadius={1.6}
              distanceFalloff={0.8}
              intensity={1.35}
              quality="high"
              halfRes
              depthAwareUpsampling
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        ) : null}
      </Canvas>

      {!preview ? (
        <div className="pointer-events-none absolute top-0 right-0 p-3">
          <div className="pointer-events-auto flex items-center gap-1 rounded-lg border bg-background/90 p-1 shadow-sm">
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

      {!preview && showInteractionHint ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border bg-background/90 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm">
          {hovered
            ? `${hovered.label}: (${hovered.cell.x}, ${hovered.cell.y}, ${hovered.cell.z}) · material ${hovered.cell.material}`
            : quality === "high"
              ? "Drag to rotate · scroll to zoom · hover for coordinates"
              : "Drag to rotate · scroll to zoom"}
        </div>
      ) : null}
    </div>
  );
}
