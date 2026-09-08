"use client";

import { useMemo, useRef, useState } from "react";
import { CameraControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { Box, RotateCcw, Scan, Square, View } from "lucide-react";
import { ToneMappingMode } from "postprocessing";
import { ACESFilmicToneMapping, NoToneMapping, SRGBColorSpace } from "three";

import { useSettings } from "@/components/settings/settings-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDevicePixelRatio } from "@/hooks/use-device-pixel-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import { CellMap, GridSpec } from "@/lib/grid";

import { GridView } from "../grid-2d/grid-2d-renderer";
import { FrameLimiter } from "./frame-limiter";
import { HoveredVoxel, RenderQuality } from "./types";
import { createVoxelGroups } from "./voxel-groups";
import { VoxelWorld } from "./voxel-world";

interface VoxelCanvasProps {
  grid: GridSpec;
  target: CellMap;
  actual: CellMap;
  view: GridView;
  hasRun: boolean;
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
  camera = DEFAULT_CAMERA,
}: VoxelCanvasProps) {
  const controls = useRef<CameraControls>(null);
  const { settings } = useSettings();
  const mobile = useIsMobile();
  const devicePixelRatio = useDevicePixelRatio();
  const [performanceReduced, setPerformanceReduced] = useState(false);
  const [hovered, setHovered] = useState<HoveredVoxel | null>(null);
  const groups = useMemo(
    () => createVoxelGroups(target, actual, view, hasRun),
    [actual, hasRun, target, view]
  );

  let quality: RenderQuality;
  if (settings.graphicsQuality === "high") quality = "high";
  else if (settings.graphicsQuality === "reduced") quality = "reduced";
  else quality = mobile || performanceReduced ? "reduced" : "high";

  const selectedScale =
    settings.renderScale === "full"
      ? 1
      : settings.renderScale === "balanced"
        ? 0.8
        : settings.renderScale === "performance"
          ? 0.65
          : performanceReduced
            ? 0.8
            : 1;
  const dprLimit = quality === "high" ? 1.5 : 1;
  const renderDpr = Math.max(
    0.6,
    Math.min(devicePixelRatio, dprLimit) * selectedScale
  );
  const explicitFrameRate =
    settings.frameRate === "auto"
      ? null
      : (Number(settings.frameRate) as 30 | 60);

  function moveCamera(position: [number, number, number]) {
    void controls.current?.setLookAt(
      ...position,
      ...camera.target,
      true
    );
  }

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden bg-muted/20">
      <Canvas
        style={{ position: "absolute", inset: 0 }}
        dpr={renderDpr}
        frameloop={explicitFrameRate ? "never" : "always"}
        camera={{
          position: camera.position,
          fov: 34,
          near: 0.1,
          far: 100,
        }}
        shadows
        gl={{
          antialias: quality === "reduced",
          alpha: false,
          outputColorSpace: SRGBColorSpace,
          toneMapping:
            quality === "high" ? NoToneMapping : ACESFilmicToneMapping,
        }}
        aria-label={`${view} three-dimensional voxel grid from ${grid.min} to ${grid.max}`}
      >
        {explicitFrameRate ? <FrameLimiter fps={explicitFrameRate} /> : null}
        {(settings.graphicsQuality === "auto" ||
          settings.renderScale === "auto") &&
        !explicitFrameRate &&
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
          groups={groups}
          quality={quality}
          onHover={setHovered}
        />
        {quality === "high" ? (
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

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <Badge variant="secondary" className="bg-background/90 shadow-sm">
          <Box aria-hidden="true" />
          {groups.reduce((total, group) => total + group.cells.length, 0)} voxels
        </Badge>
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

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border bg-background/90 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm">
        {hovered
          ? `${hovered.label}: (${hovered.cell.x}, ${hovered.cell.y}, ${hovered.cell.z}) · material ${hovered.cell.material}`
          : quality === "high"
            ? "Drag to rotate · scroll to zoom · hover for coordinates"
            : "Drag to rotate · scroll to zoom"}
      </div>
    </div>
  );
}
