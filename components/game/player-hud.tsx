"use client";

import { useProgress } from "@/components/progress/progress-provider";
import { BlockIcon } from "@/components/blocks/block-icon";
import { LEVELS } from "@/content/levels";
import { countEarnedBlocks, getPlayerStats } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const TOTAL_BLOCKS = LEVELS.length * 3;

/** A segmented XP bar: ten chunky cells that fill left to right. */
export function XpBar({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  const filled = Math.round(Math.min(1, Math.max(0, progress)) * 10);
  return (
    <div
      role="progressbar"
      aria-label="Experience to next level"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      className={cn("flex h-2.5 gap-[2px] bg-black/60 p-[2px]", className)}
    >
      {Array.from({ length: 10 }, (_, index) => (
        <span
          key={index}
          className={cn(
            "flex-1",
            index < filled
              ? "bg-diamond shadow-[inset_0_-2px_0_rgb(0_0_0/0.25)]"
              : "bg-white/8"
          )}
        />
      ))}
    </div>
  );
}

/** Compact rank, level, XP and block count for page headers. */
export function PlayerHud({ className }: { className?: string }) {
  const { progress } = useProgress();
  const stats = getPlayerStats(progress);
  const blocks = countEarnedBlocks(progress);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="hidden min-w-32 flex-col gap-1 sm:flex">
        <div className="flex items-baseline justify-between gap-2 leading-none">
          <span className="font-display text-[9px]" style={{ color: stats.rank.color }}>
            {stats.rank.name}
          </span>
          <span className="font-mono text-lg leading-none text-muted-foreground">
            Lv {stats.level}
          </span>
        </div>
        <XpBar progress={stats.levelProgress} />
      </div>
      <div
        className="flex items-center gap-1.5 bg-black/40 px-2 py-1 [--pixel:2px] pixel-border"
        title={`${blocks} of ${TOTAL_BLOCKS} blocks earned`}
      >
        <BlockIcon material={3} className="size-5" title="Blocks earned" />
        <span className="font-mono text-xl leading-none tabular-nums">
          {blocks}
          <span className="text-muted-foreground">/{TOTAL_BLOCKS}</span>
        </span>
      </div>
    </div>
  );
}

/** The large player card on the title screen. */
export function PlayerCard({ className }: { className?: string }) {
  const { progress } = useProgress();
  const stats = getPlayerStats(progress);
  const blocks = countEarnedBlocks(progress);
  const achievements = Object.keys(progress.achievements).length;

  return (
    <div className={cn("pixel-panel space-y-2 p-3", className)}>
      <div className="flex items-center gap-3">
        <div
          className="grid size-11 shrink-0 place-items-center [--pixel:2px] pixel-bevel"
          style={{ backgroundColor: stats.rank.color }}
          aria-hidden="true"
        >
          <span className="font-display text-sm text-black/70">{stats.level}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[10px] leading-5" style={{ color: stats.rank.color }}>
            {stats.rank.name} rank
          </div>
          <div className="font-mono text-lg leading-5 text-muted-foreground">
            Level {stats.level} · {stats.levelXp}/{stats.levelSpan} XP
          </div>
        </div>
      </div>
      <XpBar progress={stats.levelProgress} className="h-3" />
      <div className="flex justify-between font-mono text-lg leading-5 text-muted-foreground">
        <span>
          <span className="text-gold">{blocks}</span>/{TOTAL_BLOCKS} blocks
        </span>
        <span>
          <span className="text-gold">{achievements}</span> trophies
        </span>
      </div>
    </div>
  );
}
