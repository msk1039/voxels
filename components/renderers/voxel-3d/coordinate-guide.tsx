"use client";

import { Edges, Html, Line } from "@react-three/drei";

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
  children: React.ReactNode;
  prominent?: boolean;
}

function CoordinateLabel({
  color,
  position,
  children,
  prominent = false,
}: CoordinateLabelProps) {
  return (
    <Html
      center
      position={position}
      distanceFactor={16}
      zIndexRange={[4, 0]}
      style={{ pointerEvents: "none" }}
    >
      <span
        className={
          prominent
            ? "font-mono text-xs font-bold"
            : "font-mono text-[9px] font-medium"
        }
        style={{
          color,
          textShadow: "0 1px 2px rgb(255 255 255 / 0.9)",
        }}
      >
        {children}
      </span>
    </Html>
  );
}

export function CoordinateGuide({
  grid,
  showScale,
}: {
  grid: GridSpec;
  showScale: boolean;
}) {
  const { low, high, center, size, ticks } =
    createCoordinateGuideLayout(grid);
  const tickLength = Math.max(0.16, grid.step * 0.18);
  const labelOffset = Math.max(0.38, grid.step * 0.42);
  const axisOffset = Math.max(0.62, grid.step * 0.7);

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
              >
                {formatCoordinateTick(value)}
              </CoordinateLabel>

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
              >
                {formatCoordinateTick(value)}
              </CoordinateLabel>

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
              >
                {formatCoordinateTick(value)}
              </CoordinateLabel>
            </group>
          ))
        : null}

      <CoordinateLabel
        color={AXIS_COLORS.x}
        position={[high + axisOffset, low - labelOffset, high]}
        prominent
      >
        x
      </CoordinateLabel>
      <CoordinateLabel
        color={AXIS_COLORS.y}
        position={[low - labelOffset, high + axisOffset, high]}
        prominent
      >
        y
      </CoordinateLabel>
      <CoordinateLabel
        color={AXIS_COLORS.z}
        position={[low - labelOffset, low, low - axisOffset]}
        prominent
      >
        z
      </CoordinateLabel>
    </group>
  );
}
