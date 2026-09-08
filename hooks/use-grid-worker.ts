"use client";

import { useCallback, useEffect, useRef } from "react";

import { EquationError, EquationMode } from "@/lib/equation";
import {
  CellMap,
  GridEvaluation,
  GridSpec,
  coordinateKey,
} from "@/lib/grid";
import {
  GridWorkerRequest,
  GridWorkerResponse,
} from "@/lib/grid/worker-protocol";

export function useGridWorker() {
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);

  useEffect(
    () => () => {
      requestId.current += 1;
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  return useCallback(
    (source: string, mode: EquationMode, grid: GridSpec) =>
      new Promise<GridEvaluation>((resolve, reject) => {
        requestId.current += 1;
        const id = requestId.current;
        workerRef.current?.terminate();

        const worker = new Worker(
          new URL("../lib/grid/evaluation.worker.ts", import.meta.url),
          { type: "module" }
        );
        workerRef.current = worker;

        worker.addEventListener(
          "message",
          (event: MessageEvent<GridWorkerResponse>) => {
            if (id !== requestId.current || event.data.id !== id) return;
            worker.terminate();
            workerRef.current = null;

            if (!event.data.ok) {
              const { code, message, start, end } = event.data.error;
              reject(new EquationError(code, message, start, end));
              return;
            }

            const cells: CellMap = new Map(
              event.data.cells.map((cell) => [coordinateKey(cell), cell])
            );
            resolve({
              mode: event.data.mode,
              cells,
              complexity: event.data.complexity,
            });
          }
        );

        worker.addEventListener("error", () => {
          if (id !== requestId.current) return;
          worker.terminate();
          workerRef.current = null;
          reject(new Error("The equation worker could not start."));
        });

        const request: GridWorkerRequest = { id, source, mode, grid };
        worker.postMessage(request);
      }),
    []
  );
}
