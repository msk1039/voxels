"use client";

import { useCallback, useRef, useState } from "react";

import {
  EditorError,
  EquationEditor,
} from "@/components/game/equation-editor";
import { Grid2DRenderer } from "@/components/renderers/grid-2d/grid-2d-renderer";
import { VoxelCanvas } from "@/components/renderers/voxel-3d/voxel-canvas";
import { VoxelTransition } from "@/components/renderers/voxel-3d/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_GRID } from "@/content/levels";
import { useGridWorker } from "@/hooks/use-grid-worker";
import { EquationError, EquationMode, getErrorLocation } from "@/lib/equation";
import { CellMap, diffCellMaps } from "@/lib/grid";
import { SANDBOX_STARTERS } from "@/lib/sandbox";

import { useSandboxDrafts } from "./use-sandbox-drafts";

const EMPTY_CELLS: CellMap = new Map();

export function SandboxWorkspace() {
  const [mode, setMode] = useState<EquationMode>("2d");
  const [results, setResults] = useState<Record<EquationMode, CellMap>>(() => ({
    "2d": new Map(),
    "3d": new Map(),
  }));
  const [hasRun, setHasRun] = useState<Record<EquationMode, boolean>>({
    "2d": false,
    "3d": false,
  });
  const [complexity, setComplexity] = useState<Record<EquationMode, number>>({
    "2d": 0,
    "3d": 0,
  });
  const [errors, setErrors] = useState<Record<EquationMode, EditorError | null>>({
    "2d": null,
    "3d": null,
  });
  const [pendingMode, setPendingMode] = useState<EquationMode | null>(null);
  const [transition, setTransition] = useState<VoxelTransition | null>(null);
  const transitionId = useRef(0);
  const activeTransitionId = useRef<number | null>(null);
  const { drafts, setSource } = useSandboxDrafts();
  const runGrid = useGridWorker();

  const handleTransitionComplete = useCallback((id: number) => {
    if (activeTransitionId.current !== id) return;
    activeTransitionId.current = null;
    setTransition(null);
    setPendingMode(null);
  }, []);

  async function runEquation() {
    if (pendingMode) return;
    const runMode = mode;
    const source = drafts.sources[runMode];
    setPendingMode(runMode);

    try {
      const evaluation = await runGrid(source, runMode, DEFAULT_GRID);
      const difference = diffCellMaps(results[runMode], evaluation.cells);
      setResults((current) => ({ ...current, [runMode]: evaluation.cells }));
      setHasRun((current) => ({ ...current, [runMode]: true }));
      setComplexity((current) => ({
        ...current,
        [runMode]: evaluation.complexity,
      }));
      setErrors((current) => ({ ...current, [runMode]: null }));
      const hasVoxelChanges =
        difference.enteringKeys.size > 0 || difference.leaving.length > 0;

      if (runMode === "3d" && hasVoxelChanges) {
        const id = transitionId.current + 1;
        transitionId.current = id;
        activeTransitionId.current = id;
        setTransition({ id, ...difference });
      } else {
        setPendingMode(null);
      }
    } catch (caught) {
      const error =
        caught instanceof EquationError
          ? {
              message: caught.message,
              ...getErrorLocation(source, caught.start),
            }
          : {
              message: "The equation could not be evaluated.",
              line: 1,
              column: 1,
            };
      setErrors((current) => ({ ...current, [runMode]: error }));
      activeTransitionId.current = null;
      setTransition(null);
      setPendingMode(null);
    }
  }

  const result = results[mode];

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Sandbox</CardTitle>
          <CardDescription>
            Create without a target, unlock requirement, or campaign score.
          </CardDescription>
        </div>
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as EquationMode)}
        >
          <TabsList>
            <TabsTrigger value="2d" disabled={pendingMode !== null}>
              2D
            </TabsTrigger>
            <TabsTrigger value="3d" disabled={pendingMode !== null}>
              3D
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-h-[460px] overflow-hidden rounded-lg border">
            {mode === "2d" ? (
              <Grid2DRenderer
                grid={DEFAULT_GRID}
                target={EMPTY_CELLS}
                actual={result}
                view="result"
                hasRun={hasRun[mode]}
              />
            ) : (
              <VoxelCanvas
                grid={DEFAULT_GRID}
                target={EMPTY_CELLS}
                actual={result}
                view="result"
                hasRun={hasRun[mode]}
                transition={transition ?? undefined}
                onTransitionComplete={handleTransitionComplete}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex min-h-7 items-center gap-2" aria-live="polite">
              <Badge variant="outline">
                {mode === "2d" ? "Plane" : "Volume"}
              </Badge>
              {hasRun[mode] ? (
                <>
                  <Badge variant="secondary">{result.size} voxels</Badge>
                  <span className="text-xs text-muted-foreground">
                    Complexity {complexity[mode]}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Run the starter equation to begin.
                </span>
              )}
            </div>
            <EquationEditor
              value={drafts.sources[mode]}
              starterExpression={SANDBOX_STARTERS[mode]}
              error={errors[mode]}
              pending={pendingMode !== null}
              onChange={(value) => setSource(mode, value)}
              onRun={runEquation}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
