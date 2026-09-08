"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Code2, Lock } from "lucide-react";
import { toast } from "sonner";

import {
  EditorError,
  EquationEditor,
} from "@/components/game/equation-editor";
import { LevelHintsDialog } from "@/components/game/level-hints-dialog";
import { MatchSummary } from "@/components/game/match-summary";
import { useProgress } from "@/components/progress/progress-provider";
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
  getLevel,
  getLevelsForMode,
  getNextLevel,
} from "@/content/levels";
import { useGridWorker } from "@/hooks/use-grid-worker";
import { useIsDesktop } from "@/hooks/use-desktop";
import { EquationError, EquationMode, getErrorLocation } from "@/lib/equation";
import { CellMap, diffCellMaps, matchCells } from "@/lib/grid";
import {
  LevelCompletion,
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
          <Badge variant="outline">Level {level.order}</Badge>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
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

export function LevelWorkspace({ mode, levelId }: LevelWorkspaceProps) {
  const { progress, completeLevel } = useProgress();
  const level = getLevel(mode, levelId);
  if (!level) return null;

  if (!isLevelUnlocked(level, progress)) {
    const previous = getLevel(mode, getPreviousLevelId(level));
    return (
      <div className="flex h-[calc(100svh-5.5rem)] items-center justify-center rounded-xl border bg-background p-6">
        <Card className="max-w-sm">
          <CardHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted">
              <Lock className="size-4" aria-hidden="true" />
            </div>
            <CardTitle>Level locked</CardTitle>
            <CardDescription>
              Complete {previous?.title ?? "the previous level"} to unlock {level.title}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previous ? (
              <Link
                href={`/play/${mode}/${previous.id}`}
                className={cn(buttonVariants(), "w-full")}
              >
                Open {previous.title}
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ActiveLevel
      key={`${mode}:${levelId}`}
      level={level}
      completeLevel={completeLevel}
    />
  );
}

function getPreviousLevelId(level: LevelDefinition) {
  return (
    getLevelsForMode(level.mode).find(
      (candidate) => candidate.order === level.order - 1
    )?.id ?? ""
  );
}

function ActiveLevel({
  level,
  completeLevel,
}: {
  level: LevelDefinition;
  completeLevel: (completion: LevelCompletion) => void;
}) {
  const emptyCells = useMemo<CellMap>(() => new Map(), []);
  const router = useRouter();
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
      if (result.exact) {
        completeLevel({
          levelKey: levelProgressKey(level.mode, level.id),
          expression: result.expression,
          complexity: result.complexity,
          efficientCost: level.efficientCost,
          usedHint: result.usedHint,
        });
        const bonuses = [
          !result.usedHint ? "No hints" : null,
          result.complexity <= level.efficientCost
            ? "Efficient equation"
            : null,
        ].filter(Boolean);
        const nextHref = next ? `/play/${next.mode}/${next.id}` : "/";
        toast.success("Level complete", {
          id: `level-complete:${level.mode}:${level.id}`,
          description: [
            `${level.title} matched exactly.`,
            bonuses.join(" · "),
          ]
            .filter(Boolean)
            .join(" "),
          action: {
            label: next ? "Next level" : "Back to tracks",
            onClick: () => router.push(nextHref),
          },
        });
      }
    },
    [completeLevel, level, next, router]
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
    }
  }

  const levelInfo = (className?: string) => (
    <LevelInfoPanel
      level={level}
      match={match}
      hasRun={hasRun}
      onHintOpened={() => setUsedHint(true)}
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
        <div className="flex h-12 shrink-0 items-center border-b px-3">
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
        />
      </div>
    </div>
  );

  return (
    <>
      {desktop ? (
        <div className="grid h-[calc(100svh-5.5rem)] grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] overflow-hidden rounded-[22px] border bg-background [corner-shape:squircle]">
          <section
            className="min-w-0 overflow-hidden border-r"
            aria-label="Your render"
          >
            {renderer(false, "compare", setCameraPose)}
          </section>

          <div className="grid min-h-0 grid-rows-2">
            <section
              className="flex min-h-0 flex-col border-b"
              aria-label="Target and level information"
            >
              <div className="flex h-10 shrink-0 items-center border-b px-3">
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
                    {levelInfo(
                      "h-full rounded-[10px] [corner-shape:squircle]"
                    )}
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
                onChange={setSource}
                onRun={() => void runEquation()}
              />
            </section>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <section aria-label="Level information">
            {levelInfo("rounded-[20px] [corner-shape:squircle]")}
          </section>
          <section
            className="relative h-[540px] overflow-hidden rounded-[22px] border bg-background [corner-shape:squircle]"
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
                    <Button className="pointer-events-auto shadow-md" />
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
    </>
  );
}
