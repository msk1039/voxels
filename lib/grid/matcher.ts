import { CellMap, MatchResult } from "./types";

export function matchCells(target: CellMap, actual: CellMap): MatchResult {
  const correct: MatchResult["correct"] = [];
  const missing: MatchResult["missing"] = [];
  const extra: MatchResult["extra"] = [];
  const wrongMaterial: MatchResult["wrongMaterial"] = [];

  for (const [key, expected] of target) {
    const received = actual.get(key);
    if (!received) {
      missing.push(expected);
    } else if (received.material !== expected.material) {
      wrongMaterial.push({ expected, actual: received });
    } else {
      correct.push(received);
    }
  }
  for (const [key, received] of actual) {
    if (!target.has(key)) extra.push(received);
  }

  const targetCoverage =
    target.size === 0 ? 1 : (correct.length + wrongMaterial.length) / target.size;
  return {
    correct,
    missing,
    extra,
    wrongMaterial,
    targetCoverage,
    exact: missing.length === 0 && extra.length === 0 && wrongMaterial.length === 0,
  };
}
