"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Map as MapIcon, RotateCcw } from "lucide-react";

import { BlockIcon } from "@/components/blocks/block-icon";
import { XpBar } from "@/components/game/player-hud";
import { ProgressOutcome } from "@/components/progress/progress-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LevelDefinition } from "@/content/levels";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { playSfx } from "@/lib/audio/sfx";
import { getPlayerStats, levelProgressKey } from "@/lib/progress";
import { cn } from "@/lib/utils";

export interface CompletionResult {
  usedHint: boolean;
  complexity: number;
  outcome: ProgressOutcome;
}

interface CompletionDialogProps {
  level: LevelDefinition;
  result: CompletionResult | null;
  nextHref?: string;
  onOpenChange: (open: boolean) => void;
}

const REVEAL_STEP_MS = 420;

/** Fixed offsets so the confetti burst looks the same every time. */
const CONFETTI = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2;
  const distance = 110 + (index % 3) * 45;
  return {
    material: (index % 8) + 1,
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance * 0.7 - 30),
    delay: (index % 4) * 40,
  };
});

function Confetti() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-16 left-1/2 motion-reduce:hidden"
    >
      {CONFETTI.map((piece, index) => (
        <span
          key={index}
          className="absolute"
          style={
            {
              "--dx": `${piece.dx}px`,
              "--dy": `${piece.dy}px`,
              animation: `pixel-particle 900ms steps(9) ${piece.delay}ms both`,
            } as React.CSSProperties
          }
        >
          <BlockIcon material={piece.material} variant="flat" className="size-3" title="" />
        </span>
      ))}
    </div>
  );
}

export function CompletionDialog({
  level,
  result,
  nextHref,
  onOpenChange,
}: CompletionDialogProps) {
  const open = result !== null;
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(0);

  const key = levelProgressKey(level.mode, level.id);
  const before = result?.outcome.previous.levels[key]?.earnedBlocks;
  const after = result?.outcome.next.levels[key]?.earnedBlocks;
  const slots = [
    {
      label: "Cleared",
      detail: "Match the target exactly",
      earned: true,
      isNew: !before?.complete,
    },
    {
      label: "No hints",
      detail: result?.usedHint ? "You peeked this time" : "Solved without peeking",
      earned: Boolean(result && !result.usedHint),
      isNew: Boolean(after?.noHints && !before?.noHints),
    },
    {
      label: "Efficient",
      detail: `Size ${result?.complexity ?? "–"} · par ${level.efficientCost}`,
      earned: Boolean(result && result.complexity <= level.efficientCost),
      isNew: Boolean(after?.efficient && !before?.efficient),
    },
  ];

  const statsBefore = result ? getPlayerStats(result.outcome.previous) : null;
  const statsAfter = result ? getPlayerStats(result.outcome.next) : null;
  const xpGained = statsBefore && statsAfter ? statsAfter.xp - statsBefore.xp : 0;
  const leveledUp = Boolean(
    statsBefore && statsAfter && statsAfter.level > statsBefore.level
  );

  // Reveal the three block slots one at a time, then the XP line.
  const efficientCost = level.efficientCost;
  useEffect(() => {
    if (!result) return;
    const earned = [
      true,
      !result.usedHint,
      result.complexity <= efficientCost,
    ];
    const levelUp =
      getPlayerStats(result.outcome.next).level >
      getPlayerStats(result.outcome.previous).level;
    const steps = reduceMotion ? [] : [0, 1, 2, 3];
    const timers = steps.map((step) =>
      window.setTimeout(() => {
        setRevealed(step + 1);
        if (step < 3 && earned[step]) playSfx("block");
        if (step === 3 && levelUp) playSfx("levelUp");
      }, 350 + step * REVEAL_STEP_MS)
    );
    const start = window.setTimeout(() => {
      playSfx("success");
      if (reduceMotion) setRevealed(4);
    }, 0);
    return () => {
      window.clearTimeout(start);
      timers.forEach((timer) => window.clearTimeout(timer));
      setRevealed(0);
    };
  }, [efficientCost, reduceMotion, result]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-visible sm:max-w-md">
        <Confetti />
        <DialogHeader className="items-center text-center">
          <DialogTitle className="animate-pixel-pop font-display text-lg leading-8 text-gold text-shadow-pixel sm:text-xl">
            Level clear!
          </DialogTitle>
          <DialogDescription>
            {level.title} matches the target exactly.
          </DialogDescription>
        </DialogHeader>

        <ul className="grid grid-cols-3 gap-3" aria-label="Blocks earned">
          {slots.map((slot, index) => {
            const shown = revealed > index;
            return (
              <li
                key={slot.label}
                className="flex flex-col items-center gap-1.5 bg-black/30 p-3 text-center [--pixel:2px] pixel-border"
              >
                <span className="relative grid size-12 place-items-center">
                  {shown && slot.earned ? (
                    <BlockIcon material={3} className="size-12 animate-pixel-pop" title={`${slot.label} earned`} />
                  ) : (
                    <span
                      className={cn(
                        "size-10 bg-black/50 shadow-[inset_3px_3px_0_rgb(0_0_0/0.5)]",
                        shown && "opacity-60"
                      )}
                      aria-label={shown ? `${slot.label} not earned` : undefined}
                    />
                  )}
                  {shown && slot.earned && slot.isNew ? (
                    <span className="absolute -top-2 -right-3 bg-destructive px-1 font-display text-[7px] leading-3 text-white">
                      New
                    </span>
                  ) : null}
                </span>
                <span className="text-sm font-semibold">{slot.label}</span>
                <span className="text-xs leading-4 text-muted-foreground">{slot.detail}</span>
              </li>
            );
          })}
        </ul>

        <div
          className={cn(
            "space-y-2 transition-opacity duration-200",
            revealed >= 4 ? "opacity-100" : "opacity-0"
          )}
          aria-live="polite"
        >
          {statsAfter ? (
            <>
              <div className="flex items-baseline justify-between font-mono text-xl leading-none">
                <span className="text-diamond">+{xpGained} XP</span>
                <span className="text-muted-foreground">
                  Lv {statsAfter.level} · {statsAfter.rank.name}
                </span>
              </div>
              <XpBar progress={statsAfter.levelProgress} className="h-3" />
              {leveledUp ? (
                <p className="animate-pixel-pop text-center font-display text-[10px] text-gold">
                  Level up! You reached level {statsAfter.level}
                </p>
              ) : null}
              {result && result.outcome.newAchievements.length > 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  Trophy unlocked:{" "}
                  {result.outcome.newAchievements.map((a) => a.title).join(", ")}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <DialogFooter className="gap-3 sm:justify-between">
          <div className="flex gap-3">
            <Link
              href={`/play/${level.mode}`}
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              <MapIcon data-icon="inline-start" aria-hidden="true" />
              Map
            </Link>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              <RotateCcw data-icon="inline-start" aria-hidden="true" />
              Keep going
            </Button>
          </div>
          {nextHref ? (
            <Link
              href={nextHref}
              autoFocus
              onClick={() => playSfx("click")}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Next level
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href="/"
              autoFocus
              className={cn(buttonVariants({ variant: "gold", size: "lg" }))}
            >
              World cleared!
            </Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
