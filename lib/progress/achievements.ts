import { LEVELS, getLevelsForMode } from "@/content/levels";

import { levelProgressKey } from "./reducer";
import { ProgressState } from "./types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** Block material shown on the badge. */
  icon: number;
  isEarned: (state: ProgressState) => boolean;
}

function completedIn(state: ProgressState, mode: "2d" | "3d") {
  return getLevelsForMode(mode).filter(
    (level) => state.levels[levelProgressKey(mode, level.id)]?.completed
  ).length;
}

function levelsWith(
  state: ProgressState,
  block: "noHints" | "efficient" | "all"
) {
  return Object.values(state.levels).filter((level) => {
    const earned = level.earnedBlocks;
    if (block === "all") return earned.complete && earned.noHints && earned.efficient;
    return earned[block];
  }).length;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "first-block",
    title: "First Block",
    description: "Clear any level.",
    icon: 4,
    isEarned: (state) =>
      Object.values(state.levels).some((level) => level.completed),
  },
  {
    id: "plane-walker",
    title: "Plane Walker",
    description: "Clear 5 levels in the 2D world.",
    icon: 3,
    isEarned: (state) => completedIn(state, "2d") >= 5,
  },
  {
    id: "volume-builder",
    title: "Volume Builder",
    description: "Clear 5 levels in the 3D world.",
    icon: 1,
    isEarned: (state) => completedIn(state, "3d") >= 5,
  },
  {
    id: "sphere-maker",
    title: "Sphere Maker",
    description: "Carve a sphere out of blocks.",
    icon: 6,
    isEarned: (state) => Boolean(state.levels["3d:sphere"]?.completed),
  },
  {
    id: "no-peeking",
    title: "No Peeking",
    description: "Clear 5 levels without opening hints.",
    icon: 7,
    isEarned: (state) => levelsWith(state, "noHints") >= 5,
  },
  {
    id: "minimalist",
    title: "Minimalist",
    description: "Earn the efficient block on 10 levels.",
    icon: 5,
    isEarned: (state) => levelsWith(state, "efficient") >= 10,
  },
  {
    id: "full-set",
    title: "Full Set",
    description: "Earn all three blocks on 10 levels.",
    icon: 8,
    isEarned: (state) => levelsWith(state, "all") >= 10,
  },
  {
    id: "tinkerer",
    title: "Tinkerer",
    description: "Run 10 equations in the sandbox.",
    icon: 2,
    isEarned: (state) => state.stats.sandboxRuns >= 10,
  },
  {
    id: "persistent",
    title: "Persistent",
    description: "Keep trying after 20 runs that missed.",
    icon: 2,
    isEarned: (state) => state.stats.failedRuns >= 20,
  },
  {
    id: "world-2d",
    title: "Plane Master",
    description: "Clear every level in the 2D world.",
    icon: 3,
    isEarned: (state) => completedIn(state, "2d") === getLevelsForMode("2d").length,
  },
  {
    id: "world-3d",
    title: "Volume Master",
    description: "Clear every level in the 3D world.",
    icon: 6,
    isEarned: (state) => completedIn(state, "3d") === getLevelsForMode("3d").length,
  },
  {
    id: "completionist",
    title: "Completionist",
    description: "Earn every block in both worlds.",
    icon: 7,
    isEarned: (state) =>
      LEVELS.every((level) => {
        const earned =
          state.levels[levelProgressKey(level.mode, level.id)]?.earnedBlocks;
        return earned?.complete && earned.noHints && earned.efficient;
      }),
  },
];

export function getAchievement(id: string) {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}

/** Achievements earned by this state that have not been recorded yet. */
export function findNewAchievements(state: ProgressState): Achievement[] {
  return ACHIEVEMENTS.filter(
    (achievement) => !state.achievements[achievement.id] && achievement.isEarned(state)
  );
}
