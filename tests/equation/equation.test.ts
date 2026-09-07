import { describe, expect, it } from "vitest";

import {
  EquationError,
  compileEquation,
  evaluateEquationValue,
  evaluateMaterial,
  tokenize,
} from "../../lib/equation";

describe("equation language", () => {
  it("tokenizes comments and multi-character operators", () => {
    const tokens = tokenize("// shape\nx <= 2 && y != 0");
    expect(tokens.map((token) => token.value)).toEqual([
      "x",
      "<=",
      "2",
      "&&",
      "y",
      "!=",
      "0",
      "",
    ]);
  });

  it("uses normal arithmetic precedence", () => {
    const equation = compileEquation("1 + 2 * 3 == 7", "2d");
    expect(evaluateEquationValue(equation, { x: 0, y: 0, z: 0 })).toBe(true);
  });

  it("evaluates boolean shape expressions", () => {
    const equation = compileEquation("x == 0 || y == 0", "2d");
    expect(evaluateMaterial(equation, { x: 0, y: 4, z: 0 })).toBe(1);
    expect(evaluateMaterial(equation, { x: 2, y: 4, z: 0 })).toBe(0);
  });

  it("evaluates functions and material conditionals", () => {
    const equation = compileEquation(
      "max(abs(x), abs(y), abs(z)) <= 2 ? 6 : 0",
      "3d"
    );
    expect(evaluateMaterial(equation, { x: -2, y: 1, z: 2 })).toBe(6);
    expect(evaluateMaterial(equation, { x: 3, y: 0, z: 0 })).toBe(0);
  });

  it("rejects z in Plane Lab", () => {
    expect(() => compileEquation("z == 0", "2d")).toThrowError(
      "“z” is not available in Plane Lab"
    );
  });

  it("rejects assignment and property access", () => {
    expect(() => compileEquation("x = 2", "2d")).toThrowError(
      "Assignments are not allowed"
    );
    expect(() => compileEquation("Math.sqrt(x)", "2d")).toThrow(EquationError);
  });

  it("rejects unsafe or unknown functions", () => {
    expect(() => compileEquation("fetch(1)", "2d")).toThrowError(
      "Unknown function “fetch”"
    );
  });

  it("reports math and result errors instead of skipping cells", () => {
    const division = compileEquation("x / 0", "2d");
    expect(() =>
      evaluateMaterial(division, { x: 1, y: 0, z: 0 })
    ).toThrowError("Division by zero");

    const fractional = compileEquation("2.5", "2d");
    expect(() =>
      evaluateMaterial(fractional, { x: 0, y: 0, z: 0 })
    ).toThrowError("material number from 1 to 8");
  });

  it("calculates deterministic expression complexity", () => {
    expect(compileEquation("x == 0 || y == 0", "2d").complexity).toBe(3);
    expect(compileEquation("x*x + y*y <= 16", "2d").complexity).toBe(4);
  });
});
