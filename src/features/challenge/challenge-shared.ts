import { examWorlds } from "@/lib/challenge-data";
import type { ExamLevelRecord } from "@/types/content";

export function getLevelUnlockState(
  worldIndex: number,
  levelIndex: number,
  progress: Record<string, ExamLevelRecord>
) {
  const world = examWorlds[worldIndex];
  if (!world) {
    return false;
  }

  if (worldIndex > 0) {
    const previousWorld = examWorlds[worldIndex - 1];
    const previousWorldCleared = previousWorld?.levels.every((level) => progress[level.id]?.cleared);
    if (!previousWorldCleared) {
      return false;
    }
  }

  if (levelIndex === 0) {
    return true;
  }

  const previousLevel = world.levels[levelIndex - 1];
  return previousLevel ? Boolean(progress[previousLevel.id]?.cleared) : true;
}

export function getFirstAvailableLevel(
  worldIndex: number,
  progress: Record<string, ExamLevelRecord>
) {
  const world = examWorlds[worldIndex];
  if (!world) {
    return null;
  }

  return world.levels.find((level, levelIndex) => getLevelUnlockState(worldIndex, levelIndex, progress)) ?? null;
}

export function getCurrentPlayerLevel(
  worldIndex: number,
  progress: Record<string, ExamLevelRecord>,
  activeLevelId: string | null
) {
  const world = examWorlds[worldIndex];
  if (!world) {
    return null;
  }

  if (activeLevelId) {
    return world.levels.find((level) => level.id === activeLevelId) ?? null;
  }

  const unclearedUnlocked = world.levels.find((level, levelIndex) => {
    return getLevelUnlockState(worldIndex, levelIndex, progress) && !progress[level.id]?.cleared;
  });

  return unclearedUnlocked ?? getFirstAvailableLevel(worldIndex, progress);
}

export function findLevelEntry(levelId: string) {
  for (let worldIndex = 0; worldIndex < examWorlds.length; worldIndex += 1) {
    const world = examWorlds[worldIndex];
    const levelIndex = world.levels.findIndex((level) => level.id === levelId);
    if (levelIndex >= 0) {
      return {
        world,
        worldIndex,
        level: world.levels[levelIndex],
        levelIndex
      };
    }
  }

  return null;
}

export function getNextLevelId(worldIndex: number, levelIndex: number) {
  const world = examWorlds[worldIndex];
  if (!world) {
    return null;
  }

  const nextInWorld = world.levels[levelIndex + 1];
  if (nextInWorld) {
    return nextInWorld.id;
  }

  const nextWorld = examWorlds[worldIndex + 1];
  return nextWorld?.levels[0]?.id ?? null;
}
