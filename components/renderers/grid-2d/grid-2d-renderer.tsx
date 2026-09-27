"use client";

import { useId, useMemo } from "react";

import { getBlock } from "@/lib/blocks";
import { getTileDataUrl } from "@/lib/block-atlas";
import { CellMap, GridSpec, coordinateKey, listAxisValues } from "@/lib/grid";
import { MATCH_COLORS } from "@/lib/materials";
import { cn } from "@/lib/utils";

export type GridView = "compare" | "target" | "result";

interface Grid2DRendererProps {
  grid: GridSpec;
  target: CellMap;
  actual: CellMap;
  view: GridView;
  hasRun: boolean;
  preview?: boolean;
}

const CELL_SIZE = 48;
const CELL_GAP = 2;
const MARGIN = 62;
const FRAME = 10;

type CellLook =
  | { kind: "empty" }
  | { kind: "block"; material: number; tint?: string; tintAmount?: number; border?: string }
  | { kind: "glass" };

function cellLook(
  view: GridView,
  hasRun: boolean,
  expected: number | undefined,
  received: number | undefined
): CellLook {
  if (view === "target") {
    return expected ? { kind: "block", material: expected } : { kind: "empty" };
  }
  if (view === "result") {
    return received ? { kind: "block", material: received } : { kind: "empty" };
  }
  if (expected && (!hasRun || !received)) return { kind: "glass" };
  if (expected && received) {
    return expected === received
      ? { kind: "block", material: received, tint: MATCH_COLORS.correct, tintAmount: 0.12, border: MATCH_COLORS.correct }
      : { kind: "block", material: received, tint: MATCH_COLORS.wrongMaterial, tintAmount: 0.45, border: "#c9a4ea" };
  }
  if (received) {
    return { kind: "block", material: received, tint: MATCH_COLORS.extra, tintAmount: 0.5, border: "#ff9aa0" };
  }
  return { kind: "empty" };
}

export function Grid2DRenderer({
  grid,
  target,
  actual,
  view,
  hasRun,
  preview = false,
}: Grid2DRendererProps) {
  // Two grids can share a page (main view and target preview), so the
  // tile symbol ids must be unique per instance.
  const prefix = useId().replace(/:/g, "");
  const axis = useMemo(() => listAxisValues(grid), [grid]);
  const gridSize = axis.length * CELL_SIZE;
  const canvasSize = gridSize + MARGIN * 2;
  const tileId = (material: number | "glass") => `${prefix}-tile-${material}`;
  const inner = CELL_SIZE - CELL_GAP * 2;

  const cells = axis.flatMap((y, yIndex) =>
    axis.map((x, xIndex) => {
      const key = coordinateKey({ x, y, z: 0 });
      const expected = target.get(key)?.material;
      const received = actual.get(key)?.material;
      return {
        key,
        x,
        y,
        left: MARGIN + xIndex * CELL_SIZE + CELL_GAP,
        top: MARGIN + (axis.length - 1 - yIndex) * CELL_SIZE + CELL_GAP,
        expected,
        received,
        look: cellLook(view, hasRun, expected, received),
      };
    })
  );
  const usedMaterials = [
    ...new Set(
      cells.flatMap(({ look }) => (look.kind === "block" ? [look.material] : []))
    ),
  ];
  const usesGlass = cells.some(({ look }) => look.kind === "glass");

  return (
    <div
      className={cn(
        "flex h-full items-center justify-center overflow-auto bg-[#100e15]",
        preview ? "min-h-0 p-2" : "min-h-[420px] p-3 sm:p-6"
      )}
    >
      <svg
        viewBox={`0 0 ${canvasSize} ${canvasSize}`}
        className="aspect-square max-h-full w-full max-w-[680px]"
        shapeRendering="crispEdges"
        role="img"
        aria-label={`${view} coordinate grid from ${grid.min} to ${grid.max}`}
      >
        <defs>
          {usedMaterials.map((material) => (
            <symbol key={material} id={tileId(material)} viewBox="0 0 16 16">
              <image
                href={getTileDataUrl(material, "top")}
                width="16"
                height="16"
                style={{ imageRendering: "pixelated" }}
              />
            </symbol>
          ))}
          {usesGlass ? (
            <symbol id={tileId("glass")} viewBox="0 0 16 16">
              <image
                href={getTileDataUrl("glass", "side")}
                width="16"
                height="16"
                style={{ imageRendering: "pixelated" }}
              />
            </symbol>
          ) : null}
        </defs>

        {/* Stone frame with a stepped outline and bevel. */}
        <rect
          x={MARGIN - FRAME - 4}
          y={MARGIN - FRAME - 4}
          width={gridSize + (FRAME + 4) * 2}
          height={gridSize + (FRAME + 4) * 2}
          fill="#09080d"
        />
        <rect
          x={MARGIN - FRAME}
          y={MARGIN - FRAME}
          width={gridSize + FRAME * 2}
          height={gridSize + FRAME * 2}
          fill="#55535f"
        />
        <rect
          x={MARGIN - FRAME}
          y={MARGIN - FRAME}
          width={gridSize + FRAME * 2}
          height="4"
          fill="#7d7a88"
        />
        <rect
          x={MARGIN - FRAME}
          y={MARGIN + gridSize + FRAME - 4}
          width={gridSize + FRAME * 2}
          height="4"
          fill="#35333d"
        />
        <rect x={MARGIN} y={MARGIN} width={gridSize} height={gridSize} fill="#1a1822" />

        {axis.map((value, index) => {
          const position = MARGIN + index * CELL_SIZE + CELL_SIZE / 2;
          const highlight = value === 0 ? "fill-gold" : "fill-muted-foreground";
          return (
            <g key={value} className={cn("font-mono text-[22px]", highlight)}>
              <text x={position} y={MARGIN + gridSize + 38} textAnchor="middle">
                {value}
              </text>
              <text
                x={MARGIN - 34}
                y={MARGIN + (axis.length - 1 - index) * CELL_SIZE + CELL_SIZE / 2 + 7}
                textAnchor="middle"
              >
                {value}
              </text>
            </g>
          );
        })}

        <text
          x={MARGIN + gridSize + 30}
          y={MARGIN + gridSize / 2 + 6}
          className="fill-[#e5534b] font-display text-[16px]"
        >
          x
        </text>
        <text
          x={MARGIN + gridSize / 2}
          y={MARGIN - 28}
          textAnchor="middle"
          className="fill-[#5fbf3f] font-display text-[16px]"
        >
          y
        </text>

        {cells.map(({ key, x, y, left, top, expected, received, look }) => {
          const description = `(${x}, ${y})${
            expected ? `, target ${getBlock(expected).name}` : ""
          }${received ? `, result ${getBlock(received).name}` : ""}`;

          if (look.kind === "empty") {
            // An inventory slot: dark well, shaded top-left, lit bottom-right.
            return (
              <g key={key}>
                <title>{description}</title>
                <rect x={left} y={top} width={inner} height={inner} fill="#22202b" />
                <rect x={left} y={top} width={inner} height="3" fill="#15131b" />
                <rect x={left} y={top} width="3" height={inner} fill="#15131b" />
                <rect x={left} y={top + inner - 2} width={inner} height="2" fill="#2e2b38" />
                <rect x={left + inner - 2} y={top} width="2" height={inner} fill="#2e2b38" />
              </g>
            );
          }

          if (look.kind === "glass") {
            return (
              <g key={key}>
                <title>{description}</title>
                <rect x={left} y={top} width={inner} height={inner} fill="#1f2b3a" />
                <use href={`#${tileId("glass")}`} x={left} y={top} width={inner} height={inner} />
                <rect
                  x={left}
                  y={top}
                  width={inner}
                  height={inner}
                  fill={MATCH_COLORS.missing}
                  opacity="0.28"
                />
              </g>
            );
          }

          return (
            <g key={key}>
              <title>{description}</title>
              <use
                href={`#${tileId(look.material)}`}
                x={left}
                y={top}
                width={inner}
                height={inner}
              />
              {/* Top/left highlight and bottom/right shade, like a raised block. */}
              <rect x={left} y={top} width={inner} height="3" fill="white" opacity="0.18" />
              <rect x={left} y={top + inner - 4} width={inner} height="4" fill="black" opacity="0.28" />
              {look.tint ? (
                <rect
                  x={left}
                  y={top}
                  width={inner}
                  height={inner}
                  fill={look.tint}
                  opacity={look.tintAmount}
                />
              ) : null}
              {look.border ? (
                <rect
                  x={left + 1.5}
                  y={top + 1.5}
                  width={inner - 3}
                  height={inner - 3}
                  fill="none"
                  stroke={look.border}
                  strokeWidth="3"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
