"use client";

import Link from "next/link";
import { ChevronRight, Lock, Map as MapIcon } from "lucide-react";

import { BlockIcon } from "@/components/blocks/block-icon";
import { HeaderActions, Logo } from "@/components/app/app-header";
import { PlayerHud } from "@/components/game/player-hud";
import { CHAPTER_THEMES } from "@/components/map/chapter-themes";
import { EarnedSlots } from "@/components/map/world-map";
import { useProgress } from "@/components/progress/progress-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  CHAPTERS,
  CHAPTER_SIZE,
  WORLD_NAMES,
  getChapterName,
  getLevel,
  getLevelsForMode,
} from "@/content/levels";
import { playSfx } from "@/lib/audio/sfx";
import { countCompleted, isLevelUnlocked, levelProgressKey } from "@/lib/progress";
import { cn } from "@/lib/utils";

interface GameScaffoldProps {
  mode: "2d" | "3d";
  levelId: string;
  children: React.ReactNode;
}

export function GameScaffold({ mode, levelId, children }: GameScaffoldProps) {
  const { progress } = useProgress();
  const levels = getLevelsForMode(mode);
  const level = getLevel(mode, levelId);
  const completed = countCompleted(progress, mode);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b-[3px] border-border p-3">
          <Logo className="h-8 px-1" />
        </SidebarHeader>
        <SidebarContent>
          {CHAPTERS[mode].map((chapter, chapterIndex) => (
            <SidebarGroup key={chapter}>
              <SidebarGroupLabel className="gap-2 font-display text-[9px] text-gold">
                <BlockIcon
                  material={CHAPTER_THEMES[mode][chapterIndex].block}
                  className="size-4"
                  title=""
                />
                {chapter}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {levels
                    .slice(chapterIndex * CHAPTER_SIZE, (chapterIndex + 1) * CHAPTER_SIZE)
                    .map((entry) => {
                      const entryProgress =
                        progress.levels[levelProgressKey(mode, entry.id)];
                      const unlocked = isLevelUnlocked(entry, progress);
                      return (
                        <SidebarMenuItem key={entry.id}>
                          {unlocked ? (
                            <SidebarMenuButton
                              render={
                                <Link
                                  href={`/play/${mode}/${entry.id}`}
                                  onClick={() => playSfx("click")}
                                />
                              }
                              isActive={levelId === entry.id}
                            >
                              <span className="w-5 text-right font-mono text-lg leading-none text-muted-foreground">
                                {entry.order}
                              </span>
                              <span className="truncate">{entry.title}</span>
                              <EarnedSlots
                                earned={entryProgress?.earnedBlocks}
                                className="ml-auto"
                              />
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton
                              aria-disabled="true"
                              className="cursor-not-allowed opacity-50"
                              onClick={() => playSfx("locked")}
                            >
                              <span className="w-5 text-right font-mono text-lg leading-none">
                                {entry.order}
                              </span>
                              <span className="truncate">{entry.title}</span>
                              <Lock className="ml-auto size-3.5" aria-label="Locked" />
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t-[3px] border-border p-3 font-mono text-lg leading-5 text-muted-foreground">
          <span>
            <span className="text-gold">{completed}</span>/{levels.length} cleared ·
            saved in this browser
          </span>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b-[3px] border-border bg-card/90 px-3">
          <SidebarTrigger />
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-sm"
          >
            <Link
              href={`/play/${mode}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}
            >
              <MapIcon data-icon="inline-start" aria-hidden="true" />
              {WORLD_NAMES[mode]}
            </Link>
            {level ? (
              <>
                <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                <span className="hidden shrink-0 text-muted-foreground sm:inline">
                  {getChapterName(level)}
                </span>
                <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                <span className="truncate font-semibold" aria-current="page">
                  {level.order}. {level.title}
                </span>
              </>
            ) : null}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <PlayerHud className="hidden lg:flex" />
            <HeaderActions />
          </div>
        </header>
        <main className="min-h-0 flex-1 p-3 sm:p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
