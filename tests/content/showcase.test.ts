import { describe, expect, it } from "vitest";

import { DEFAULT_GRID } from "../../content/levels";
import { SHOWCASE } from "../../content/showcase";
import { evaluateGrid } from "../../lib/grid";

describe("title screen showcase", () => {
  it("builds a substantial 3D shape from every equation", () => {
    for (const { name, equation } of SHOWCASE) {
      const { cells } = evaluateGrid(equation, "3d", DEFAULT_GRID);
      expect(cells.size, name).toBeGreaterThan(20);
    }
  });

  it("uses more than one kind of block in most showcases", () => {
    const colourful = SHOWCASE.filter(({ equation }) => {
      const { cells } = evaluateGrid(equation, "3d", DEFAULT_GRID);
      return new Set([...cells.values()].map((cell) => cell.material)).size > 1;
    });
    expect(colourful.length).toBeGreaterThanOrEqual(SHOWCASE.length - 1);
  });
});
