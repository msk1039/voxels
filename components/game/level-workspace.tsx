"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleHelp, Lock } from "lucide-react";

import { CompletionDialog } from "@/components/game/completion-dialog";
import {
  EditorError,
  EquationEditor,
} from "@/components/game/equation-editor";
import { MatchSummary } from "@/components/game/match-summary";
import { useProgress } from "@/components/progress/progress-provider";
import {
  Grid2DRenderer,
  GridView,
} from "@/components/renderers/grid-2d/grid-2d-renderer";
import { VoxelCanvas } from "@/components/renderers/voxel-3d/voxel-canvas";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LevelDefinition,
  getLevel,
  getLevelsForMode,
  getNextLevel,
} from "@/content/levels";
import { useGridWorker } from "@/hooks/use-grid-worker";
import { EquationError, EquationMode, getErrorLocation } from "@/lib/equation";
import { CellMap, matchCells } from "@/lib/grid";
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
}

function WorkspaceContent({
  level,
  actual,
  view,
  hasRun,
}: WorkspaceContentProps) {
  if (level.mode === "2d") {
    return (
      <Grid2DRenderer
        grid={level.grid}
        target={level.target}
        actual={actual}
        view={view}
        hasRun={hasRun}
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
    />
  );
}

interface ControlPanelProps {
  level: LevelDefinition;
  source: string;
  error: EditorError | null;
  pending: boolean;
  match: ReturnType<typeof matchCells>;
  hasRun: boolean;
  onSourceChange: (value: string) => void;
  onRun: () => void;
  onHintOpened: () => void;
}

function ControlPanel({
  level,
  source,
  error,
  pending,
  match,
  hasRun,
  onSourceChange,
  onRun,
  onHintOpened,
}: ControlPanelProps) {
  const coverage = hasRun ? Math.round(match.targetCoverage * 100) : 0;
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <Card size="sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline">Level {level.order}</Badge>
            <span className="text-xs text-muted-foreground">{level.concept}</span>
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
      <EquationEditor
        value={source}
        starterExpression={level.starterExpression}
        error={error}
        pending={pending}
        hints={level.hints}
        onChange={onSourceChange}
        onRun={onRun}
        onHintOpened={onHintOpened}
      />
    </div>
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
  const [source, setSource] = useState(level.starterExpression);
  const [actual, setActual] = useState<CellMap>(emptyCells);
  const [hasRun, setHasRun] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<EditorError | null>(null);
  const [view, setView] = useState<GridView>("compare");
  const [usedHint, setUsedHint] = useState(false);
  const [complexity, setComplexity] = useState(0);
  const [completionOpen, setCompletionOpen] = useState(false);
  const runGrid = useGridWorker();

  const match = useMemo(
    () => matchCells(level.target, actual),
    [level.target, actual]
  );
  const next = getNextLevel(level);

  async function runEquation() {
    if (pending) return;
    setPending(true);
    try {
      const evaluation = await runGrid(source, level.mode, level.grid);
      const nextMatch = matchCells(level.target, evaluation.cells);
      setActual(evaluation.cells);
      setComplexity(evaluation.complexity);
      setHasRun(true);
      setError(null);
      setView("compare");
      if (nextMatch.exact) {
        completeLevel({
          levelKey: levelProgressKey(level.mode, level.id),
          expression: source,
          complexity: evaluation.complexity,
          efficientCost: level.efficientCost,
          usedHint,
        });
        setCompletionOpen(true);
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
    } finally {
      setPending(false);
    }
  }

  const controls = (
    <ControlPanel
      level={level}
      source={source}
      error={error}
      pending={pending}
      match={match}
      hasRun={hasRun}
      onSourceChange={setSource}
      onRun={runEquation}
      onHintOpened={() => setUsedHint(true)}
    />
  );
  const renderer = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center border-b px-3">
        <Tabs value={view} onValueChange={(value) => setView(value as GridView)}>
          <TabsList>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="target">Target</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          <CircleHelp className="size-3.5" aria-hidden="true" />
          {level.mode === "2d" ? "Hover a cell for its coordinate" : "Drag to rotate"}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <WorkspaceContent
          level={level}
          actual={actual}
          view={view}
          hasRun={hasRun}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden h-[calc(100svh-5.5rem)] overflow-hidden rounded-xl border bg-background lg:block">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="65%" minSize="45%">
            {renderer}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="35%" minSize="300px" maxSize="480px">
            {controls}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div className="overflow-hidden rounded-xl border bg-background lg:hidden">
        <div className="min-h-[480px]">{renderer}</div>
        <div className="border-t">{controls}</div>
      </div>
      <CompletionDialog
        level={level}
        open={completionOpen}
        usedHint={usedHint}
        complexity={complexity}
        nextHref={next ? `/play/${next.mode}/${next.id}` : undefined}
        onOpenChange={setCompletionOpen}
      />
    </>
  );
}
