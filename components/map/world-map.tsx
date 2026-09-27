"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { toast } from "sonner";

import { BlockIcon } from "@/components/blocks/block-icon";
import { useProgress } from "@/components/progress/progress-provider";
import {
  CHAPTERS,
  CHAPTER_SIZE,
  LevelDefinition,
  WORLD_NAMES,
  getLevelsForMode,
} from "@/content/levels";
import { playSfx } from "@/lib/audio/sfx";
import { EquationMode } from "@/lib/equation";
import {
  EarnedBlocks,
  countCompleted,
  getContinueLevel,
  isLevelUnlocked,
  levelProgressKey,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

import { CHAPTER_THEMES } from "./chapter-themes";

/** Three slots showing which of a level's blocks have been earned. */
export function EarnedSlots({
  earned,
  className,
}: {
  earned?: EarnedBlocks;
  className?: string;
}) {
  const slots = [
    { key: "complete", label: "Cleared", on: earned?.complete },
    { key: "noHints", label: "No hints", on: earned?.noHints },
    { key: "efficient", label: "Efficient", on: earned?.efficient },
  ];
  return (
    <span className={cn("flex gap-0.5", className)}>
      {slots.map((slot) =>
        slot.on ? (
          <BlockIcon key={slot.key} material={3} variant="flat" className="size-3.5" title={slot.label} />
        ) : (
          <span
            key={slot.key}
            title={`${slot.label} (not earned)`}
            className="size-3.5 bg-black/50 shadow-[inset_1px_1px_0_rgb(0_0_0/0.6)]"
          />
        )
      )}
    </span>
  );
}

function LevelNode({
  level,
  block,
  unlocked,
  current,
  earned,
  blockedBy,
}: {
  level: LevelDefinition;
  block: number;
  unlocked: boolean;
  current: boolean;
  earned?: EarnedBlocks;
  blockedBy?: LevelDefinition;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const completed = Boolean(earned?.complete);

  useEffect(() => {
    if (current) nodeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current]);

  const body = (
    <>
      {current ? (
        <ChevronDown
          aria-hidden="true"
          className="absolute -top-7 left-1/2 size-6 -translate-x-1/2 animate-pixel-bob text-gold drop-shadow-[2px_2px_0_rgb(0_0_0/0.6)]"
        />
      ) : null}
      <span className="relative">
        <BlockIcon
          material={block}
          className={cn(
            "size-16 transition-transform duration-100 group-hover:-translate-y-1",
            !unlocked && "opacity-40 grayscale"
          )}
          title=""
        />
        <span className="absolute inset-0 grid place-items-center pt-3 font-display text-sm text-white text-shadow-pixel">
          {unlocked ? level.order : <Lock className="size-5" aria-hidden="true" />}
        </span>
      </span>
      <span
        className={cn(
          "max-w-24 truncate text-center text-sm",
          unlocked ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {level.title}
      </span>
      <EarnedSlots earned={earned} className={cn(!completed && "opacity-60")} />
    </>
  );

  const label = `Level ${level.order}: ${level.title}${
    completed ? ", cleared" : unlocked ? "" : ", locked"
  }`;

  return (
    <div ref={nodeRef} className="relative z-10 flex flex-col items-center">
      {unlocked ? (
        <Link
          href={`/play/${level.mode}/${level.id}`}
          aria-label={label}
          onClick={() => playSfx("click")}
          className="group flex flex-col items-center gap-1.5 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {body}
        </Link>
      ) : (
        <button
          type="button"
          aria-label={label}
          aria-disabled="true"
          className="group flex cursor-not-allowed flex-col items-center gap-1.5 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          onClick={(event) => {
            playSfx("locked");
            event.currentTarget.animate(
              [
                { transform: "translateX(0)" },
                { transform: "translateX(-4px)" },
                { transform: "translateX(4px)" },
                { transform: "translateX(0)" },
              ],
              { duration: 240, easing: "steps(4)" }
            );
            toast(`Locked. Clear ${blockedBy?.title ?? "the previous level"} first.`, {
              id: "locked-level",
            });
          }}
        >
          {body}
        </button>
      )}
    </div>
  );
}

export function WorldMap({ mode }: { mode: EquationMode }) {
  const { progress } = useProgress();
  const levels = getLevelsForMode(mode);
  const continueLevel = getContinueLevel(mode, progress);
  const completed = countCompleted(progress, mode);
  const chapters = CHAPTERS[mode].map((name, index) => ({
    name,
    theme: CHAPTER_THEMES[mode][index],
    levels: levels.slice(index * CHAPTER_SIZE, (index + 1) * CHAPTER_SIZE),
  }));
  const allCleared = completed === levels.length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[10px] text-gold">{mode.toUpperCase()} world</p>
          <h1 className="mt-2 font-display text-xl leading-tight text-shadow-pixel sm:text-2xl">
            {WORLD_NAMES[mode]}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "2d"
              ? "Flat puzzles on the x–y grid. Each clear unlocks the next level."
              : "Add z and build in three dimensions. Each clear unlocks the next level."}
          </p>
        </div>
        <div className="pixel-panel px-3 py-2 font-mono text-2xl leading-none">
          <span className="text-gold">{completed}</span>/{levels.length} cleared
        </div>
      </header>

      <ol className="space-y-8">
        {chapters.map((chapter, chapterIndex) => {
          const chapterDone = chapter.levels.filter(
            (level) => progress.levels[levelProgressKey(mode, level.id)]?.completed
          ).length;
          return (
            <li key={chapter.name}>
              <section
                aria-label={`Chapter ${chapterIndex + 1}: ${chapter.name}`}
                className="pixel-panel overflow-visible p-4 sm:p-5"
                style={{ backgroundColor: chapter.theme.tint }}
              >
                <div className="mb-8 flex items-center gap-3">
                  <BlockIcon material={chapter.theme.block} className="size-8" />
                  <h2 className="font-display text-xs text-shadow-pixel">
                    {chapterIndex + 1}. {chapter.name}
                  </h2>
                  <span className="ml-auto font-mono text-xl leading-none text-foreground/80">
                    {chapterDone}/{chapter.levels.length}
                  </span>
                </div>
                <div className="relative grid grid-cols-3 gap-y-8 sm:grid-cols-5">
                  {/* The dotted trail the level nodes sit on. */}
                  <div
                    aria-hidden="true"
                    className="absolute top-8 right-[10%] left-[10%] hidden h-1 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.35)_0_8px,transparent_8px_16px)] sm:block"
                  />
                  {chapter.levels.map((level) => {
                    const previous = levels.find((candidate) => candidate.order === level.order - 1);
                    return (
                      <LevelNode
                        key={level.id}
                        level={level}
                        block={chapter.theme.block}
                        unlocked={isLevelUnlocked(level, progress)}
                        current={!allCleared && level.id === continueLevel.id}
                        earned={progress.levels[levelProgressKey(mode, level.id)]?.earnedBlocks}
                        blockedBy={previous}
                      />
                    );
                  })}
                </div>
              </section>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
