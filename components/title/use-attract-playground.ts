"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { EditorError } from "@/components/game/equation-editor";
import { VoxelTransition } from "@/components/renderers/voxel-3d/types";
import { DEFAULT_GRID } from "@/content/levels";
import { Showcase } from "@/content/showcase";
import { useGridWorker } from "@/hooks/use-grid-worker";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { playSfx } from "@/lib/audio/sfx";
import { EquationError, getErrorLocation } from "@/lib/equation";
import { CellMap, diffCellMaps } from "@/lib/grid";

const TYPE_INTERVAL_MS = 32;
const HOLD_MS = 6500;

/**
 * Drives the title screen: types each showcase equation into the command
 * bar, builds it, holds, then moves on. Taking the controls (editing)
 * pauses the loop until the visitor resumes it.
 */
export function useAttractPlayground(showcases: readonly Showcase[]) {
  const reduceMotion = useReducedMotion();
  const runGrid = useGridWorker();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [cells, setCells] = useState<CellMap>(() => new Map());
  const [transition, setTransition] = useState<VoxelTransition | null>(null);
  const [error, setError] = useState<EditorError | null>(null);
  const [pending, setPending] = useState(false);
  const cellsRef = useRef(cells);
  const transitionId = useRef(0);

  const current = showcases[index % showcases.length];
  const equation = current.equation;
  const typing = !editing && typed < equation.length;

  const build = useCallback(
    async (source: string) => {
      setPending(true);
      try {
        const result = await runGrid(source, "3d", DEFAULT_GRID);
        const difference = diffCellMaps(cellsRef.current, result.cells);
        transitionId.current += 1;
        cellsRef.current = result.cells;
        setCells(result.cells);
        setTransition({ id: transitionId.current, ...difference });
        setError(null);
        return true;
      } catch (caught) {
        if (caught instanceof EquationError) {
          setError({ message: caught.message, ...getErrorLocation(source, caught.start) });
        } else {
          setError({ message: "The equation could not be evaluated.", line: 1, column: 1 });
        }
        return false;
      } finally {
        setPending(false);
      }
    },
    [runGrid]
  );

  // Type the current showcase one character at a time.
  useEffect(() => {
    if (!typing) return;
    const timer = window.setTimeout(
      () => setTyped(reduceMotion ? equation.length : (value) => value + 1),
      TYPE_INTERVAL_MS
    );
    return () => window.clearTimeout(timer);
  }, [equation.length, reduceMotion, typed, typing]);

  // Once typed, build it, hold, then advance to the next showcase.
  useEffect(() => {
    if (editing || typed < equation.length) return;
    let cancelled = false;
    let hold = 0;
    const start = window.setTimeout(() => {
      void build(equation).then(() => {
        if (cancelled) return;
        hold = window.setTimeout(() => {
          setIndex((value) => (value + 1) % showcases.length);
          setTyped(0);
        }, HOLD_MS);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
      window.clearTimeout(hold);
    };
  }, [build, editing, equation, showcases.length, typed]);

  const takeControl = useCallback(() => {
    if (editing) return;
    setDraft(equation);
    setEditing(true);
  }, [editing, equation]);

  const resume = useCallback(() => {
    setEditing(false);
    setError(null);
    setIndex((value) => (value + 1) % showcases.length);
    setTyped(0);
  }, [showcases.length]);

  const skip = useCallback(
    (step: 1 | -1) => {
      setEditing(false);
      setError(null);
      setIndex((value) => (value + step + showcases.length) % showcases.length);
      setTyped(0);
    },
    [showcases.length]
  );

  const runDraft = useCallback(async () => {
    playSfx("run");
    const ok = await build(draft);
    playSfx(ok ? "pop" : "error");
  }, [build, draft]);

  return {
    showcase: current,
    text: editing ? draft : equation.slice(0, typed),
    typing,
    editing,
    pending,
    error,
    cells,
    transition,
    blockCount: cells.size,
    setDraft,
    takeControl,
    resume,
    skip,
    runDraft,
    clearTransition: useCallback((id: number) => {
      setTransition((value) => (value?.id === id ? null : value));
    }, []),
  };
}
