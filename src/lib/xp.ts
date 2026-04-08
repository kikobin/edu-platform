import { LEVELS, type Level } from "@/types";

const LEVELS_DESC = [...LEVELS].reverse();

export function getLevelByXP(xp: number): Level {
  return LEVELS_DESC.find((l) => xp >= l.minXP) ?? LEVELS_DESC[LEVELS_DESC.length - 1]!;
}

export function getProgressToNextLevel(xp: number): number {
  const current = getLevelByXP(xp);
  if (current.level === LEVELS.at(-1)!.level) return 100;
  const range = current.maxXP - current.minXP + 1;
  const earned = xp - current.minXP;
  return Math.min(100, Math.round((earned / range) * 100));
}

export function getNextLevel(xp: number): Level | null {
  const current = getLevelByXP(xp);
  return LEVELS.find((l) => l.level === current.level + 1) ?? null;
}
