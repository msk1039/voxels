"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Code2, Lock, Map as MapIcon } from "lucide-react";

import { BlockIcon } from "@/components/blocks/block-icon";
import {
  CompletionDialog,
  CompletionResult,
} from "@/components/game/completion-dialog";
import {
  EditorError,
  EquationEditor,
} from "@/components/game/equation-editor";
import { LevelHintsDialog } from "@/components/game/level-hints-dialog";
import { MatchSummary } from "@/components/game/match-summary";
import {
  ProgressOutcome,
  useProgress,
} from "@/components/progress/progress-provider";
import {
  Grid2DRenderer,
  GridView,
} from "@/components/renderers/grid-2d/grid-2d-renderer";
import { VoxelCanvas } from "@/components/renderers/voxel-3d/voxel-canvas";
import {
  CameraPose,
  VoxelTransition,
} from "@/components/renderers/voxel-3d/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LevelDefinition,
  getChapterName,
  getLevel,
  getLevelsForMode,
  getNextLevel,
} from "@/content/levels";
import { useGridWorker } from "@/hooks/use-grid-worker";
import { useIsDesktop } from "@/hooks/use-desktop";
import { playSfx } from "@/lib/audio/sfx";
import { EquationError, EquationMode, getErrorLocation } from "@/lib/equation";
import { CellMap, diffCellMaps, matchCells } from "@/lib/grid";
import {
  LevelCompletion,
  RunRecord,
  isLevelUnlocked,
  levelProgressKey,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

interface LevelWorkspaceProps {
  mode: EquationMode;
  levelId: string;
}

interface WorkspaceContentProps {
  level: LevelDefinition;
  actual: CellMap;
  view: GridView;
  hasRun: boolean;
  transition: VoxelTransition | null;
  onTransitionComplete: (id: number) => void;
  preview?: boolean;
  showInteractionHint?: boolean;
  cameraPose?: CameraPose;
  onCameraChange?: (pose: CameraPose) => void;
  burstId?: number;
}

function WorkspaceContent({
  level,
  actual,
  view,
  hasRun,
  transition,
  onTransitionComplete,
  preview = false,
  showInteractionHint = true,
  cameraPose,
  onCameraChange,
  burstId,
}: WorkspaceContentProps) {
  if (level.mode === "2d") {
    return (
      <Grid2DRenderer
        grid={level.grid}
        target={level.target}
        actual={actual}
        view={view}
        hasRun={hasRun}
        preview={preview}
      />
    );
  }
  return (
    <VoxelCanvas
      grid={level.grid}
      target={level.target}
      actual={actual}
      view={view}
      hasRun={hasRun}
      camera={level.camera}
      transition={transition ?? undefined}
      onTransitionComplete={onTransitionComplete}
      preview={preview}
      showInteractionHint={showInteractionHint}
      cameraPose={cameraPose}
      onCameraChange={onCameraChange}
      burstId={burstId}
    />
  );
}

interface PendingRun {
  transitionId: number;
  expression: string;
  complexity: number;
  usedHint: boolean;
  exact: boolean;
}

interface LevelInfoPanelProps {
  level: LevelDefinition;
  match: ReturnType<typeof matchCells>;
  hasRun: boolean;
  onHintOpened: () => void;
  className?: string;
}

function LevelInfoPanel({
  level,
  match,
  hasRun,
  onHintOpened,
  className,
}: LevelInfoPanelProps) {
  const coverage = hasRun ? Math.round(match.targetCoverage * 100) : 0;
  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <div className="mb-1 flex items-center gap-2">
          <Badge variant="outline">
            {getChapterName(level)} · {level.order}
          </Badge>
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {level.concept}
          </span>
          <div className="ml-auto">
            <LevelHintsDialog hints={level.hints} onOpen={onHintOpened} />
          </div>
        </div>
        <CardTitle>{level.title}</CardTitle>
        <CardDescription>{level.objective}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={coverage}>
          <ProgressLabel>Target covered</ProgressLabel>
          <ProgressValue />
        </Progress>
        <MatchSummary match={match} hasRun={hasRun} />
      </CardContent>
    </Card>
  );
}

/** False during server rendering and hydration, true afterwards. */
function useHydrated() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
}

function LockedLevel({ level }: { level: LevelDefinition }) {
  const previous = getLevelsForMode(level.mode).find(
    (candidate) => candidate.order === level.order - 1
  );
  return (
    <div className="grid min-h-[60svh] place-items-center p-4">
      <section className="w-full max-w-md space-y-4 pixel-panel p-6 text-center">
        <div className="relative mx-auto w-fit">
          <BlockIcon material="glass" className="size-20" title="" />
          <Lock
            className="absolute inset-0 m-auto size-8 text-gold drop-shadow-[2px_2px_0_rgb(0_0_0/0.6)]"
            aria-hidden="true"
          />
        </div>
        <h1 className="font-display text-sm text-gold">Level locked</h1>
        <p className="text-muted-foreground">
          Clear{" "}
          {previous ? (
            <Link
              href={`/play/${previous.mode}/${previous.id}`}
              className="text-foreground underline underline-offset-4"
            >
              {previous.order}. {previous.title}
            </Link>
          ) : (
            "the previous level"
          )}{" "}
          to unlock {level.title}.
        </p>
        <Link
          href={`/play/${level.mode}`}
          className={cn(buttonVariants({ size: "lg" }), "mx-auto")}
        >
          <MapIcon data-icon="inline-start" aria-hidden="true" />
          Back to the map
        </Link>
      </section>
    </div>
  );
}

export function LevelWorkspace({ mode, levelId }: LevelWorkspaceProps) {
  const { progress, completeLevel, recordRun, recordHintOpened } = useProgress();
  const hydrated = useHydrated();
  const level = getLevel(mode, levelId);
  if (!level) return null;
  // Stored progress is only known after hydration; until then assume the
  // level is open rather than flashing a lock screen.
  if (hydrated && !isLevelUnlocked(level, progress)) {
    return <LockedLevel level={level} />;
  }

  return (
    <ActiveLevel
      key={`${mode}:${levelId}`}
      level={level}
      completeLevel={completeLevel}
      recordRun={recordRun}
      recordHintOpened={recordHintOpened}
    />
  );
}

function ActiveLevel({
  level,
  completeLevel,
  recordRun,
  recordHintOpened,
}: {
  level: LevelDefinition;
  completeLevel: (completion: LevelCompletion) => ProgressOutcome;
  recordRun: (run: RunRecord) => void;
  recordHintOpened: () => void;
}) {
  const emptyCells = useMemo<CellMap>(() => new Map(), []);
  const [source, setSource] = useState(level.starterExpression);
  const [actual, setActual] = useState<CellMap>(emptyCells);
  const [hasRun, setHasRun] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<EditorError | null>(null);
  const [view, setView] = useState<GridView>("compare");
  const [usedHint, setUsedHint] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [desktopPanel, setDesktopPanel] = useState<"target" | "level">(
    "target"
  );
  const [cameraPose, setCameraPose] = useState<CameraPose | null>(null);
  const [transition, setTransition] = useState<VoxelTransition | null>(null);
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [burstId, setBurstId] = useState(0);
  const transitionId = useRef(0);
  const pendingRun = useRef<PendingRun | null>(null);
  const runGrid = useGridWorker();
  const desktop = useIsDesktop();

  const match = useMemo(
    () => matchCells(level.target, actual),
    [level.target, actual]
  );
  const next = getNextLevel(level);

  const finishRun = useCallback(
    (result: PendingRun) => {
      setTransition(null);
      setPending(false);
      recordRun({ context: "level", solved: result.exact });
      if (result.exact) {
        const outcome = completeLevel({
          levelKey: levelProgressKey(level.mode, level.id),
          expression: result.expression,
          complexity: result.complexity,
          efficientCost: level.efficientCost,
          usedHint: result.usedHint,
        });
        setBurstId((value) => value + 1);
        setCompletion({
          usedHint: result.usedHint,
          complexity: result.complexity,
          outcome,
        });
      } else {
        playSfx("miss");
      }
    },
    [completeLevel, level, recordRun]
  );

  const handleTransitionComplete = useCallback(
    (id: number) => {
      const result = pendingRun.current;
      if (!result || result.transitionId !== id) return;
      pendingRun.current = null;
      finishRun(result);
    },
    [finishRun]
  );

  async function runEquation(closeEditorOnSuccess = false) {
    if (pending) return;
    setPending(true);
    playSfx("run");
    try {
      const evaluation = await runGrid(source, level.mode, level.grid);
      const nextMatch = matchCells(level.target, evaluation.cells);
      const difference = diffCellMaps(actual, evaluation.cells);
      setActual(evaluation.cells);
      setHasRun(true);
      setError(null);
      setView("compare");
      if (closeEditorOnSuccess) setEditorOpen(false);
      const hasVoxelChanges =
        difference.enteringKeys.size > 0 || difference.leaving.length > 0;
      const result: PendingRun = {
        transitionId: 0,
        expression: source,
        complexity: evaluation.complexity,
        usedHint,
        exact: nextMatch.exact,
      };

      if (level.mode === "3d" && hasVoxelChanges) {
        const id = transitionId.current + 1;
        transitionId.current = id;
        pendingRun.current = { ...result, transitionId: id };
        setTransition({ id, ...difference });
      } else {
        finishRun(result);
      }
    } catch (caught) {
      if (caught instanceof EquationError) {
        const location = getErrorLocation(source, caught.start);
        setError({ message: caught.message, ...location });
      } else {
        setError({
          message: "The equation could not be evaluated.",
          line: 1,
          column: 1,
        });
      }
      pendingRun.current = null;
      setTransition(null);
      setPending(false);
      setShakeKey((value) => value + 1);
      playSfx("error");
      recordRun({ context: "level", solved: false });
    }
  }

  const levelInfo = (className?: string) => (
    <LevelInfoPanel
      level={level}
      match={match}
      hasRun={hasRun}
      onHintOpened={() => {
        if (!usedHint) recordHintOpened();
        setUsedHint(true);
      }}
      className={className}
    />
  );

  const renderer = (
    showTabs: boolean,
    rendererView: GridView,
    onCameraChange?: (pose: CameraPose) => void
  ) => (
    <div className="flex h-full min-h-0 flex-col">
      {showTabs ? (
        <div className="flex h-12 shrink-0 items-center border-b-[3px] border-border bg-black/20 px-3">
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as GridView)}
          >
            <TabsList>
              <TabsTrigger value="compare">Compare</TabsTrigger>
              <TabsTrigger value="target">Target</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <WorkspaceContent
          level={level}
          actual={actual}
          view={rendererView}
          hasRun={hasRun}
          transition={transition}
          onTransitionComplete={handleTransitionComplete}
          showInteractionHint={false}
          onCameraChange={onCameraChange}
          burstId={burstId}
        />
      </div>
    </div>
  );

  return (
    <>
      {desktop ? (
        <div className="grid h-[calc(100svh-6rem)] grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] overflow-hidden pixel-panel">
          <section
            className="min-w-0 overflow-hidden border-r-[3px] border-border"
            aria-label="Your render"
          >
            {renderer(false, "compare", setCameraPose)}
          </section>

          <div className="grid min-h-0 grid-rows-2">
            <section
              className="flex min-h-0 flex-col border-b-[3px] border-border"
              aria-label="Target and level information"
            >
              <div className="flex h-11 shrink-0 items-center border-b-[3px] border-border bg-black/20 px-3">
                <Tabs
                  value={desktopPanel}
                  onValueChange={(value) =>
                    setDesktopPanel(value as "target" | "level")
                  }
                >
                  <TabsList>
                    <TabsTrigger value="target">Target</TabsTrigger>
                    <TabsTrigger value="level">Level info</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="min-h-0 flex-1">
                {desktopPanel === "target" ? (
                  <WorkspaceContent
                    level={level}
                    actual={actual}
                    view="target"
                    hasRun={hasRun}
                    transition={null}
                    onTransitionComplete={handleTransitionComplete}
                    preview
                    cameraPose={cameraPose ?? undefined}
                  />
                ) : (
                  <div className="h-full p-3">
                    {levelInfo("h-full overflow-y-auto")}
                  </div>
                )}
              </div>
            </section>
            <section
              className="min-h-0 overflow-hidden"
              aria-label="Equation editor"
            >
              <EquationEditor
                value={source}
                starterExpression={level.starterExpression}
                error={error}
                pending={pending}
                variant="pane"
                showReference={false}
                shakeKey={shakeKey}
                onChange={setSource}
                onRun={() => void runEquation()}
              />
            </section>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <section aria-label="Level information">
            {levelInfo()}
          </section>
          <section
            className="relative h-[540px] overflow-hidden pixel-panel"
            aria-label="Render workspace"
          >
            {renderer(true, view)}
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex justify-center">
              <Drawer
                open={editorOpen}
                onOpenChange={setEditorOpen}
                showSwipeHandle
              >
                <DrawerTrigger
                  render={
                    <Button size="lg" className="pointer-events-auto" />
                  }
                >
                  <Code2 data-icon="inline-start" aria-hidden="true" />
                  Edit equation
                </DrawerTrigger>
                <DrawerContent className="max-h-[92svh]">
                  <DrawerHeader>
                    <DrawerTitle>{level.title} equation</DrawerTitle>
                    <DrawerDescription>
                      Edit the expression and run it against the target.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="overflow-y-auto p-4 pb-6">
                    <EquationEditor
                      value={source}
                      starterExpression={level.starterExpression}
                      error={error}
                      pending={pending}
                      shakeKey={shakeKey}
                      onChange={setSource}
                      onRun={() => void runEquation(true)}
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </section>
        </div>
      )}
      <CompletionDialog
        level={level}
        result={completion}
        nextHref={next ? `/play/${next.mode}/${next.id}` : undefined}
        onOpenChange={(open) => {
          if (!open) setCompletion(null);
        }}
      />
    </>
  );
}
