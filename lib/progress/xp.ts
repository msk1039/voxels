import { ACHIEVEMENTS } from "./achievements";
import { ProgressState } from "./types";

/**
 * XP is derived from progress rather than stored, so it can never drift
 * out of sync with the blocks a player has earned.
 */
export const XP_REWARDS = {
  complete: 100,
  noHints: 50,
  efficient: 75,
  achievement: 150,
} as const;

/** Ranks are named after block tiers, from humble to rare. */
export const RANKS = [
  { minLevel: 1, name: "Wood", color: "#b8864b" },
  { minLevel: 3, name: "Stone", color: "#9a98a3" },
  { minLevel: 5, name: "Iron", color: "#d8d2c8" },
  { minLevel: 7, name: "Gold", color: "#f2c14e" },
  { minLevel: 9, name: "Diamond", color: "#4fd6d0" },
  { minLevel: 11, name: "Obsidian", color: "#9a74e0" },
] as const;

export type Rank = (typeof RANKS)[number];

/** Total XP needed to reach a player level: 0, 150, 450, 900, … */
export function xpForLevel(level: number) {
  return (150 * (level - 1) * level) / 2;
}

export function levelForXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

export function rankForLevel(level: number): Rank {
  let rank: Rank = RANKS[0];
  for (const candidate of RANKS) {
    if (level >= candidate.minLevel) rank = candidate;
  }
  return rank;
}

export function totalXp(state: ProgressState) {
  let xp = 0;
  for (const level of Object.values(state.levels)) {
    if (level.earnedBlocks.complete) xp += XP_REWARDS.complete;
    if (level.earnedBlocks.noHints) xp += XP_REWARDS.noHints;
    if (level.earnedBlocks.efficient) xp += XP_REWARDS.efficient;
  }
  const known = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));
  for (const id of Object.keys(state.achievements)) {
    if (known.has(id)) xp += XP_REWARDS.achievement;
  }
  return xp;
}

export interface PlayerStats {
  xp: number;
  level: number;
  rank: Rank;
  /** XP earned inside the current level. */
  levelXp: number;
  /** XP the current level spans. */
  levelSpan: number;
  /** 0–1 progress towards the next level. */
  levelProgress: number;
}

export function getPlayerStats(state: ProgressState): PlayerStats {
  const xp = totalXp(state);
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const span = xpForLevel(level + 1) - floor;
  return {
    xp,
    level,
    rank: rankForLevel(level),
    levelXp: xp - floor,
    levelSpan: span,
    levelProgress: (xp - floor) / span,
  };
}
