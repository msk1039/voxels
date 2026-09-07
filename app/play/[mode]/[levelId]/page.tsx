import { notFound } from "next/navigation";

import { GameScaffold } from "@/components/app/game-scaffold";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";

interface LevelPageProps {
  params: Promise<{ mode: string; levelId: string }>;
}

export default async function LevelPage({ params }: LevelPageProps) {
  const { mode, levelId } = await params;
  if (mode !== "2d" && mode !== "3d") notFound();

  return (
    <GameScaffold mode={mode} levelId={levelId}>
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-[calc(100svh-5.5rem)] overflow-hidden rounded-xl border bg-background"
      >
        <ResizablePanel defaultSize="65%" minSize="45%">
          <div className="flex h-full min-h-[520px] items-center justify-center bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {mode === "2d"
              ? "The coordinate grid will appear here."
              : "The voxel world will appear here."}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="35%" minSize="280px" maxSize="480px">
          <div className="flex h-full flex-col gap-4 p-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>{levelId.replaceAll("-", " ")}</CardTitle>
                <CardDescription>
                  Level content is connected in the next stage.
                </CardDescription>
              </CardHeader>
            </Card>
            <div className="space-y-2">
              <label htmlFor="equation" className="text-sm font-medium">
                Equation
              </label>
              <Textarea id="equation" className="min-h-32 font-mono" disabled />
              <Button className="w-full" disabled>
                Run equation
              </Button>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </GameScaffold>
  );
}
