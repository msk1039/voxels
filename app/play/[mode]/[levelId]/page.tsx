import { notFound } from "next/navigation";

import { GameScaffold } from "@/components/app/game-scaffold";
import { LevelWorkspace } from "@/components/game/level-workspace";
import { LEVELS, getLevel } from "@/content/levels";
import { EquationMode } from "@/lib/equation";

interface LevelPageProps {
  params: Promise<{ mode: string; levelId: string }>;
}

export function generateStaticParams() {
  return LEVELS.map((level) => ({
    mode: level.mode,
    levelId: level.id,
  }));
}

export default async function LevelPage({ params }: LevelPageProps) {
  const { mode, levelId } = await params;
  if (
    (mode !== "2d" && mode !== "3d") ||
    !getLevel(mode as EquationMode, levelId)
  ) {
    notFound();
  }

  return (
    <GameScaffold mode={mode as EquationMode} levelId={levelId}>
      <LevelWorkspace mode={mode as EquationMode} levelId={levelId} />
    </GameScaffold>
  );
}
