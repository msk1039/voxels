import {
  EquationError,
  EquationErrorCode,
  EquationMode,
} from "@/lib/equation";

import { evaluateGrid } from "./evaluate";
import { Cell, GridSpec } from "./types";

export interface GridWorkerRequest {
  id: number;
  source: string;
  mode: EquationMode;
  grid: GridSpec;
}

export type GridWorkerResponse =
  | {
      id: number;
      ok: true;
      mode: EquationMode;
      cells: Cell[];
      complexity: number;
    }
  | {
      id: number;
      ok: false;
      error: {
        code: EquationErrorCode;
        message: string;
        start: number;
        end: number;
      };
    };

export function processGridWorkerRequest(
  request: GridWorkerRequest
): GridWorkerResponse {
  try {
    const result = evaluateGrid(request.source, request.mode, request.grid);
    return {
      id: request.id,
      ok: true,
      mode: result.mode,
      cells: [...result.cells.values()],
      complexity: result.complexity,
    };
  } catch (caught) {
    if (caught instanceof EquationError) {
      return {
        id: request.id,
        ok: false,
        error: {
          code: caught.code,
          message: caught.message,
          start: caught.start,
          end: caught.end,
        },
      };
    }
    return {
      id: request.id,
      ok: false,
      error: {
        code: "MATH",
        message: "The equation could not be evaluated.",
        start: 0,
        end: 1,
      },
    };
  }
}
