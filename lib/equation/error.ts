export type EquationErrorCode =
  | "TOKEN"
  | "SYNTAX"
  | "UNKNOWN_NAME"
  | "UNAVAILABLE_VARIABLE"
  | "LIMIT"
  | "TYPE"
  | "MATH"
  | "RESULT";

export class EquationError extends Error {
  readonly code: EquationErrorCode;
  readonly start: number;
  readonly end: number;

  constructor(
    code: EquationErrorCode,
    message: string,
    start: number,
    end = start + 1
  ) {
    super(message);
    this.name = "EquationError";
    this.code = code;
    this.start = start;
    this.end = Math.max(start + 1, end);
  }
}

export function getErrorLocation(source: string, offset: number) {
  const before = source.slice(0, offset);
  const lines = before.split("\n");
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}
