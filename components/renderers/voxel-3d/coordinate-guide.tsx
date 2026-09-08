"use client";

import { useEffect, useMemo } from "react";
import { Edges, Line } from "@react-three/drei";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

import { GridSpec } from "@/lib/grid";

import {
  createCoordinateGuideLayout,
  formatCoordinateTick,
} from "./coordinate-guide-layout";

const AXIS_COLORS = {
  x: "#dc4b45",
  y: "#32985b",
  z: "#3976c5",
} as const;

interface CoordinateLabelProps {
  color: string;
  position: [number, number, number];
  texture?: CanvasTexture;
  prominent?: boolean;
}

function CoordinateLabel({
  color,
  position,
  texture,
  prominent = false,
}: CoordinateLabelProps) {
  if (!texture) return null;

  return (
    <sprite
      position={position}
      scale={prominent ? [0.62, 0.31, 1] : [0.48, 0.24, 1]}
      renderOrder={10}
    >
      <spriteMaterial
        map={texture}
        color={color}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        transparent
      />
    </sprite>
  );
}

function createLabelTexture(label: string) {
  if (typeof document === "undefined") return undefined;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return undefined;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.font = "600 32px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, canvas.width / 2, canvas.height / 2 + 1);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
}

export function CoordinateGuide({
  grid,
  showScale,
}: {
  grid: GridSpec;
  showScale: boolean;
}) {
  const { low, high, center, size, ticks } = useMemo(
    () => createCoordinateGuideLayout(grid),
    [grid]
  );
  const labels = useMemo(
    () => [...new Set([...ticks.map(formatCoordinateTick), "x", "y", "z"])],
    [ticks]
  );
  const labelTextures = useMemo(
    () =>
      new Map(labels.map((label) => [label, createLabelTexture(label)])),
    [labels]
  );
  const tickLength = Math.max(0.16, grid.step * 0.18);
  const labelOffset = Math.max(0.38, grid.step * 0.42);
  const axisOffset = Math.max(0.62, grid.step * 0.7);

  useEffect(
    () => () => {
      for (const texture of labelTextures.values()) texture?.dispose();
    },
    [labelTextures]
  );

  return (
    <group>
      <mesh position={[center, center, center]}>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color="#73808a" lineWidth={1} />
      </mesh>

      <Line
        points={[
          [low, low, high],
          [high, low, high],
        ]}
        color={AXIS_COLORS.x}
        lineWidth={1.5}
      />
      <Line
        points={[
          [low, low, high],
          [low, high, high],
        ]}
        color={AXIS_COLORS.y}
        lineWidth={1.5}
      />
      <Line
        points={[
          [low, low, low],
          [low, low, high],
        ]}
        color={AXIS_COLORS.z}
        lineWidth={1.5}
      />

      {showScale
        ? ticks.map((value) => (
            <group key={`coordinate-tick:${value}`}>
              <Line
                points={[
                  [value, low, high],
                  [value, low - tickLength, high],
                ]}
                color={AXIS_COLORS.x}
                lineWidth={1}
              />
              <CoordinateLabel
                color={AXIS_COLORS.x}
                position={[value, low - labelOffset, high]}
                texture={labelTextures.get(formatCoordinateTick(value))}
              />

              <Line
                points={[
                  [low, value, high],
                  [low - tickLength, value, high],
                ]}
                color={AXIS_COLORS.y}
                lineWidth={1}
              />
              <CoordinateLabel
                color={AXIS_COLORS.y}
                position={[low - labelOffset, value, high]}
                texture={labelTextures.get(formatCoordinateTick(value))}
              />

              <Line
                points={[
                  [low, low, value],
                  [low - tickLength, low, value],
                ]}
                color={AXIS_COLORS.z}
                lineWidth={1}
              />
              <CoordinateLabel
                color={AXIS_COLORS.z}
                position={[low - labelOffset, low, value]}
                texture={labelTextures.get(formatCoordinateTick(value))}
              />
            </group>
          ))
        : null}

      <CoordinateLabel
        color={AXIS_COLORS.x}
        position={[high + axisOffset, low - labelOffset, high]}
        texture={labelTextures.get("x")}
        prominent
      />
      <CoordinateLabel
        color={AXIS_COLORS.y}
        position={[low - labelOffset, high + axisOffset, high]}
        texture={labelTextures.get("y")}
        prominent
      />
      <CoordinateLabel
        color={AXIS_COLORS.z}
        position={[low - labelOffset, low, low - axisOffset]}
        texture={labelTextures.get("z")}
        prominent
      />
    </group>
  );
}
