"use client";

import { Lock } from "lucide-react";

import { BlockIcon } from "@/components/blocks/block-icon";
import { PlayerCard } from "@/components/game/player-hud";
import { useProgress } from "@/components/progress/progress-provider";
import { ACHIEVEMENTS, XP_REWARDS } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function TrophyRoom() {
  const { progress } = useProgress();
  const unlocked = ACHIEVEMENTS.filter((achievement) => progress.achievements[achievement.id]);
  const stats = [
    { label: "Level runs", value: progress.stats.runs },
    { label: "Missed runs", value: progress.stats.failedRuns },
    { label: "Hints opened", value: progress.stats.hintsOpened },
    { label: "Sandbox builds", value: progress.stats.sandboxRuns },
  ];

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_18rem]">
      <section aria-labelledby="trophies-heading" className="space-y-5">
        <div>
          <p className="font-display text-[10px] text-gold">
            {unlocked.length}/{ACHIEVEMENTS.length} unlocked
          </p>
          <h1 id="trophies-heading" className="mt-2 font-display text-xl text-shadow-pixel">
            Trophies
          </h1>
          <p className="mt-2 text-muted-foreground">
            Each trophy is worth {XP_REWARDS.achievement} XP.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {ACHIEVEMENTS.map((achievement) => {
            const earned = Boolean(progress.achievements[achievement.id]);
            return (
              <li
                key={achievement.id}
                className={cn(
                  "flex items-center gap-3 pixel-panel p-3",
                  !earned && "bg-muted"
                )}
              >
                <span className="relative shrink-0">
                  <BlockIcon
                    material={achievement.icon}
                    className={cn("size-12", !earned && "opacity-30 grayscale")}
                    title=""
                  />
                  {!earned ? (
                    <Lock
                      className="absolute inset-0 m-auto size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      "font-semibold",
                      earned ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {achievement.title}
                    <span className="sr-only">{earned ? " (unlocked)" : " (locked)"}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{achievement.description}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="space-y-4" aria-label="Player statistics">
        <PlayerCard />
        <dl className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-black/30 p-3 [--pixel:2px] pixel-border">
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="font-mono text-3xl leading-none text-gold tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
