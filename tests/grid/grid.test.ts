import { describe, expect, it } from "vitest";

import { LEVELS, LEVEL_SOLUTIONS } from "../../content/levels";
import {
  coordinateKey,
  evaluateGrid,
  listCoordinates,
  matchCells,
} from "../../lib/grid";

describe("grid engine", () => {
  it("lists a plane and volume deterministically", () => {
    const grid = { min: -1, max: 1, step: 1 };
    expect(listCoordinates("2d", grid)).toHaveLength(9);
    expect(listCoordinates("3d", grid)).toHaveLength(27);
    expect(coordinateKey({ x: -1, y: 0, z: 2 })).toBe("-1,0,2");
  });

  it("separates missing, extra, and wrong-material cells", () => {
    const target = evaluateGrid("x == 0 ? 2 : 0", "2d", {
      min: -1,
      max: 1,
      step: 1,
    }).cells;
    const actual = evaluateGrid("y == 0 ? 3 : 0", "2d", {
      min: -1,
      max: 1,
      step: 1,
    }).cells;
    const result = matchCells(target, actual);
    expect(result.correct).toHaveLength(0);
    expect(result.missing).toHaveLength(2);
    expect(result.extra).toHaveLength(2);
    expect(result.wrongMaterial).toHaveLength(1);
    expect(result.exact).toBe(false);
  });

  it("matches every canonical level solution exactly", () => {
    for (const level of LEVELS) {
      const solution = LEVEL_SOLUTIONS[`${level.mode}:${level.id}`];
      const actual = evaluateGrid(solution, level.mode, level.grid).cells;
      expect(matchCells(level.target, actual).exact, level.title).toBe(true);
    }
  });

  it("contains twenty levels in each track", () => {
    expect(LEVELS.filter((level) => level.mode === "2d")).toHaveLength(20);
    expect(LEVELS.filter((level) => level.mode === "3d")).toHaveLength(20);
  });

  it("orders each track contiguously with unique ids and real targets", () => {
    for (const mode of ["2d", "3d"] as const) {
      const levels = LEVELS.filter((level) => level.mode === mode);
      expect(new Set(levels.map((level) => level.id)).size).toBe(levels.length);
      expect(levels.map((level) => level.order).sort((a, b) => a - b)).toEqual(
        levels.map((_, index) => index + 1)
      );
      for (const level of levels) {
        expect(level.target.size, level.title).toBeGreaterThan(0);
      }
    }
  });
});
