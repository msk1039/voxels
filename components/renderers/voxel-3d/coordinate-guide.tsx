"use client";

import { useEffect, useMemo, useState } from "react";
import { Edges, Line } from "@react-three/drei";
import { CanvasTexture, NearestFilter, SRGBColorSpace } from "three";

import { GridSpec } from "@/lib/grid";

import {
  createCoordinateGuideLayout,
  formatCoordinateTick,
} from "./coordinate-guide-layout";

const AXIS_COLORS = {
  x: "#e5534b",
  y: "#5fbf3f",
  z: "#3f7fe0",
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
  const height = prominent ? 0.5 : 0.36;
  const aspect = (texture.userData.aspect as number | undefined) ?? 2;

  return (
    <sprite
      position={position}
      scale={[height * aspect, height, 1]}
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

/** The pixel display font's generated family name, from next/font. */
function pixelFontFamily() {
  const family = getComputedStyle(document.body)
    .getPropertyValue("--font-pixel-display")
    .trim();
  return family || "monospace";
}

function createLabelTexture(label: string) {
  if (typeof document === "undefined") return undefined;

  // Drawn at the font's native 8px grid and magnified with nearest
  // filtering, so labels stay crisp and blocky at any zoom.
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return undefined;
  const font = `8px ${pixelFontFamily()}`;
  context.font = font;
  canvas.width = Math.ceil(context.measureText(label).width) + 3;
  canvas.height = 11;

  // Resizing the canvas resets its state.
  context.font = font;
  context.textBaseline = "top";
  // A hard drop shadow keeps labels readable against the sky and blocks.
  context.fillStyle = "rgba(0, 0, 0, 0.75)";
  context.fillText(label, 2, 2);
  context.fillStyle = "#ffffff";
  context.fillText(label, 1, 1);

  const texture = new CanvasTexture(canvas);
  texture.userData.aspect = canvas.width / canvas.height;
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  return texture;
}

/** Becomes true once web fonts load, so labels can redraw in the pixel font. */
function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return ready;
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
  const fontsReady = useFontsReady();
  const labelTextures = useMemo(
    () =>
      new Map(
        labels.map((label) => [
          label,
          fontsReady ? createLabelTexture(label) : undefined,
        ])
      ),
    [fontsReady, labels]
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
        <Edges color="#2b3f58" lineWidth={1} transparent opacity={0.45} />
      </mesh>

      <Line
        points={[
          [low, low, high],
          [high, low, high],
        ]}
        color={AXIS_COLORS.x}
        lineWidth={3}
      />
      <Line
        points={[
          [low, low, high],
          [low, high, high],
        ]}
        color={AXIS_COLORS.y}
        lineWidth={3}
      />
      <Line
        points={[
          [low, low, low],
          [low, low, high],
        ]}
        color={AXIS_COLORS.z}
        lineWidth={3}
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
                lineWidth={2}
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
                lineWidth={2}
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
                lineWidth={2}
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
