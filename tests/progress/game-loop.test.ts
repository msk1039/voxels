import { describe, expect, it } from "vitest";

import { LEVELS, getLevelsForMode } from "../../content/levels";
import {
  ACHIEVEMENTS,
  EMPTY_PROGRESS,
  ProgressState,
  XP_REWARDS,
  applyLevelCompletion,
  findNewAchievements,
  getPlayerStats,
  isLevelUnlocked,
  levelForXp,
  levelProgressKey,
  parseProgress,
  rankForLevel,
  recordHintOpened,
  recordRun,
  unlockAchievements,
  xpForLevel,
} from "../../lib/progress";

function complete(
  state: ProgressState,
  key: string,
  { usedHint = false, efficient = true } = {}
) {
  return applyLevelCompletion(state, {
    levelKey: key,
    expression: "x == 0",
    complexity: efficient ? 1 : 99,
    efficientCost: 1,
    usedHint,
  });
}

describe("progress migration", () => {
  it("upgrades version 1 progress without losing completions", () => {
    const migrated = parseProgress({
      schemaVersion: 1,
      levels: {
        "2d:origin": {
          completed: true,
          earnedBlocks: { complete: true, noHints: false, efficient: true },
          bestComplexity: 3,
          bestExpression: "x == 0 && y == 0",
        },
      },
    });

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.levels["2d:origin"].earnedBlocks.efficient).toBe(true);
    expect(migrated.stats).toEqual({
      runs: 0,
      failedRuns: 0,
      hintsOpened: 0,
      sandboxRuns: 0,
    });
    expect(migrated.achievements).toEqual({});
  });

  it("keeps valid stats and achievements and drops bad ones", () => {
    const parsed = parseProgress({
      schemaVersion: 2,
      levels: {},
      stats: { runs: 4, failedRuns: -1, hintsOpened: "x", sandboxRuns: 2 },
      achievements: { "first-block": true, bogus: "yes" },
    });
    expect(parsed.stats).toEqual({
      runs: 4,
      failedRuns: 0,
      hintsOpened: 0,
      sandboxRuns: 2,
    });
    expect(parsed.achievements).toEqual({ "first-block": true });
  });
});

describe("run statistics", () => {
  it("counts level runs, misses, sandbox runs and hints separately", () => {
    let state = recordRun(EMPTY_PROGRESS, { context: "level", solved: false });
    state = recordRun(state, { context: "level", solved: true });
    state = recordRun(state, { context: "sandbox" });
    state = recordHintOpened(state);
    expect(state.stats).toEqual({
      runs: 2,
      failedRuns: 1,
      hintsOpened: 1,
      sandboxRuns: 1,
    });
  });

  it("keeps stats and achievements when a level is completed", () => {
    const withStats = unlockAchievements(
      recordRun(EMPTY_PROGRESS, { context: "sandbox" }),
      ["tinkerer"]
    );
    const next = complete(withStats, "2d:origin");
    expect(next.stats.sandboxRuns).toBe(1);
    expect(next.achievements).toEqual({ tinkerer: true });
  });
});

describe("experience", () => {
  it("uses a growing level curve", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(150);
    expect(xpForLevel(3)).toBe(450);
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(149)).toBe(1);
    expect(levelForXp(150)).toBe(2);
    expect(levelForXp(451)).toBe(3);
  });

  it("derives XP from earned blocks and recorded achievements", () => {
    const state = unlockAchievements(
      complete(EMPTY_PROGRESS, "2d:origin", { usedHint: true }),
      ["first-block", "not-a-real-achievement"]
    );
    const stats = getPlayerStats(state);
    expect(stats.xp).toBe(
      XP_REWARDS.complete + XP_REWARDS.efficient + XP_REWARDS.achievement
    );
    expect(stats.level).toBe(levelForXp(stats.xp));
    expect(stats.levelProgress).toBeGreaterThanOrEqual(0);
    expect(stats.levelProgress).toBeLessThan(1);
  });

  it("names ranks after block tiers", () => {
    expect(rankForLevel(1).name).toBe("Wood");
    expect(rankForLevel(4).name).toBe("Stone");
    expect(rankForLevel(20).name).toBe("Obsidian");
  });
});

describe("achievements", () => {
  it("have unique ids", () => {
    const ids = ACHIEVEMENTS.map((achievement) => achievement.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reports only achievements that are earned and not yet recorded", () => {
    const state = complete(EMPTY_PROGRESS, "2d:origin");
    expect(findNewAchievements(state).map((a) => a.id)).toEqual(["first-block"]);
    const recorded = unlockAchievements(state, ["first-block"]);
    expect(findNewAchievements(recorded)).toEqual([]);
  });

  it("unlocks world clears and the completionist award", () => {
    let state = EMPTY_PROGRESS;
    for (const level of LEVELS) {
      state = complete(state, levelProgressKey(level.mode, level.id));
    }
    const ids = findNewAchievements(state).map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining(["world-2d", "world-3d", "completionist", "full-set"])
    );
    expect(ids).not.toContain("tinkerer");
  });
});

describe("level unlocking", () => {
  const [first, second, third] = getLevelsForMode("2d");

  it("opens the first level and each level after a clear", () => {
    expect(isLevelUnlocked(first, EMPTY_PROGRESS)).toBe(true);
    expect(isLevelUnlocked(second, EMPTY_PROGRESS)).toBe(false);
    const state = complete(EMPTY_PROGRESS, levelProgressKey("2d", first.id));
    expect(isLevelUnlocked(second, state)).toBe(true);
    expect(isLevelUnlocked(third, state)).toBe(false);
  });

  it("keeps a cleared level open even when its predecessor is not", () => {
    const state = complete(EMPTY_PROGRESS, levelProgressKey("2d", third.id));
    expect(isLevelUnlocked(third, state)).toBe(true);
  });
});
