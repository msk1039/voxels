"use client";

import { toast } from "sonner";

import { BlockIcon } from "@/components/blocks/block-icon";
import { playSfx } from "@/lib/audio/sfx";
import { Achievement, XP_REWARDS } from "@/lib/progress";

/** Slides in one pixel toast per newly unlocked achievement. */
export function announceAchievements(achievements: readonly Achievement[]) {
  achievements.forEach((achievement, index) => {
    window.setTimeout(() => {
      playSfx("achievement");
      toast.custom(
        () => (
          <div className="flex w-[min(92vw,22rem)] items-center gap-3 bg-[#150d1f] p-3 text-foreground [--border:#3b1d74] pixel-bevel">
            <BlockIcon material={achievement.icon} className="size-10 animate-pixel-pop" />
            <div className="min-w-0">
              <div className="font-display text-[9px] leading-4 text-gold">
                Achievement unlocked!
              </div>
              <div className="truncate text-base font-semibold">
                {achievement.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {achievement.description}{" "}
                <span className="text-diamond">+{XP_REWARDS.achievement} XP</span>
              </div>
            </div>
          </div>
        ),
        { id: `achievement:${achievement.id}`, position: "top-right", duration: 4500 }
      );
    }, index * 700);
  });
}
