"use client";

import { useMemo } from "react";

import { CellMap, GridSpec, coordinateKey, listAxisValues } from "@/lib/grid";
import { MATCH_COLORS, getMaterialColor } from "@/lib/materials";

export type GridView = "compare" | "target" | "result";

interface Grid2DRendererProps {
  grid: GridSpec;
  target: CellMap;
  actual: CellMap;
  view: GridView;
  hasRun: boolean;
}

const CELL_SIZE = 48;
const CELL_GAP = 3;
const MARGIN = 62;

export function Grid2DRenderer({
  grid,
  target,
  actual,
  view,
  hasRun,
}: Grid2DRendererProps) {
  const axis = useMemo(() => listAxisValues(grid), [grid]);
  const gridSize = axis.length * CELL_SIZE;
  const canvasSize = gridSize + MARGIN * 2;

  return (
    <div className="flex h-full min-h-[420px] items-center justify-center overflow-auto bg-muted/20 p-3 sm:p-6">
      <svg
        viewBox={`0 0 ${canvasSize} ${canvasSize}`}
        className="aspect-square max-h-full w-full max-w-[680px]"
        role="img"
        aria-label={`${view} coordinate grid from ${grid.min} to ${grid.max}`}
      >
        <defs>
          <pattern
            id="missing-hatch"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke={MATCH_COLORS.missing}
              strokeWidth="2"
              opacity="0.45"
            />
          </pattern>
        </defs>

        <rect
          x={MARGIN - 8}
          y={MARGIN - 8}
          width={gridSize + 16}
          height={gridSize + 16}
          rx="12"
          fill="#ffffff"
          stroke="#d8dee4"
        />

        {axis.map((value, index) => {
          const position = MARGIN + index * CELL_SIZE + CELL_SIZE / 2;
          return (
            <g key={value} className="fill-muted-foreground text-[12px] font-medium">
              <text x={position} y={MARGIN + gridSize + 29} textAnchor="middle">
                {value}
              </text>
              <text
                x={MARGIN - 27}
                y={MARGIN + (axis.length - 1 - index) * CELL_SIZE + CELL_SIZE / 2 + 4}
                textAnchor="middle"
              >
                {value}
              </text>
            </g>
          );
        })}

        <text
          x={MARGIN + gridSize + 23}
          y={MARGIN + gridSize / 2 + 4}
          className="fill-muted-foreground text-[13px] font-semibold"
        >
          x
        </text>
        <text
          x={MARGIN + gridSize / 2}
          y={MARGIN - 25}
          textAnchor="middle"
          className="fill-muted-foreground text-[13px] font-semibold"
        >
          y
        </text>

        {axis.flatMap((y, yIndex) =>
          axis.map((x, xIndex) => {
            const key = coordinateKey({ x, y, z: 0 });
            const expected = target.get(key);
            const received = actual.get(key);
            const description = `(${x}, ${y})${
              expected ? `, target material ${expected.material}` : ""
            }${received ? `, result material ${received.material}` : ""}`;
            let fill = "#f6f7f8";
            let stroke = "#e2e6ea";
            let strokeWidth = 1;

            if (view === "target" && expected) {
              fill = getMaterialColor(expected.material);
              stroke = "#ffffff";
            } else if (view === "result" && received) {
              fill = getMaterialColor(received.material);
              stroke = "#ffffff";
            } else if (view === "compare") {
              if (!hasRun && expected) {
                fill = "url(#missing-hatch)";
                stroke = MATCH_COLORS.missing;
                strokeWidth = 2;
              } else if (expected && received) {
                if (expected.material === received.material) {
                  fill = MATCH_COLORS.correct;
                  stroke = "#ffffff";
                } else {
                  fill = MATCH_COLORS.wrongMaterial;
                  stroke = "#ffffff";
                }
              } else if (expected) {
                fill = "url(#missing-hatch)";
                stroke = MATCH_COLORS.missing;
                strokeWidth = 2;
              } else if (received) {
                fill = MATCH_COLORS.extra;
                stroke = "#ffffff";
              }
            }

            return (
              <rect
                key={key}
                x={MARGIN + xIndex * CELL_SIZE + CELL_GAP}
                y={MARGIN + (axis.length - 1 - yIndex) * CELL_SIZE + CELL_GAP}
                width={CELL_SIZE - CELL_GAP * 2}
                height={CELL_SIZE - CELL_GAP * 2}
                rx="5"
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              >
                <title>{description}</title>
              </rect>
            );
          })
        )}
      </svg>
    </div>
  );
}
