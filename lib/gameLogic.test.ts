import { describe, it, expect } from 'vitest';
import { 
  getStreakMultiplier, 
  calculateDayScore, 
  processPlantEvolution, 
  daysBetween 
} from './gameLogic';
import { ForestTree } from './types';

describe('Game Logic - Scoring & Evolution', () => {

  describe('getStreakMultiplier', () => {
    it('returns 1.0 for streak < 3', () => {
      expect(getStreakMultiplier(0)).toBe(1.0);
      expect(getStreakMultiplier(2)).toBe(1.0);
    });

    it('returns 1.2 for streak >= 3 and < 7', () => {
      expect(getStreakMultiplier(3)).toBe(1.2);
      expect(getStreakMultiplier(6)).toBe(1.2);
    });

    it('returns 1.5 for streak >= 7', () => {
      expect(getStreakMultiplier(7)).toBe(1.5);
      expect(getStreakMultiplier(14)).toBe(1.5);
    });
  });

  describe('calculateDayScore', () => {
    it('calculates basic score correctly (no streak, no bonus)', () => {
      // 5/5 normal tasks + 0/2 hard tasks = 5/7 tasks (71%)
      // 5/10 revenue = 50%
      // Average goal percent = (71 + 50) / 2 = 60.5% (>= 50%)
      const result = calculateDayScore(true, 5, 5, 0, 2, 5, 10, 0);
      // watering (1) + normal (5*1) + hard (0) + revenue bonus (5) = 11.0
      expect(result.totalDayScore).toBe(11.0);
      expect(result.isWin).toBe(true); 
    });

    it('applies streak multiplier to tasks', () => {
      const result = calculateDayScore(true, 3, 5, 1, 2, 0, 10, 3);
      // watering (1) + (normal 3 + hard 2) * 1.2 = 1 + 5 * 1.2 = 7.0
      expect(result.totalDayScore).toBe(7.0);
    });

    it('applies revenue bonus if target reached', () => {
      // revenue 6M, target 10M -> 60% (>= 50% threshold) -> 5 pts bonus
      const result = calculateDayScore(true, 0, 5, 0, 2, 6, 10, 0);
      // watering (1) + tasks (0) + revenue bonus (5) = 6.0
      expect(result.revenuePts).toBe(5);
      expect(result.totalDayScore).toBe(6.0);
    });

    it('applies streak multiplier to revenue bonus', () => {
      const result = calculateDayScore(true, 0, 5, 0, 2, 6, 10, 3);
      // watering (1) + (tasks 0 + revenue bonus 5) * 1.2 = 7.0
      expect(result.revenuePts).toBe(6); // 5 * 1.2
      expect(result.totalDayScore).toBe(7.0);
    });

    it('penalty for not watering', () => {
      const result = calculateDayScore(false, 5, 5, 2, 2, 0, 10, 0);
      // watering (-2) + tasks (5*1 + 2*2) = -2 + 9 = 7.0
      expect(result.wateringPts).toBe(-2);
      expect(result.totalDayScore).toBe(7.0);
    });

    it('calculates isWin correctly based on threshold', () => {
      // Score < 5 -> isWin false
      const resultLow = calculateDayScore(true, 1, 5, 0, 2, 0, 10, 0);
      expect(resultLow.totalDayScore).toBe(2.0);
      expect(resultLow.isWin).toBe(false);
    });
  });

  describe('processPlantEvolution', () => {
    const forest: ForestTree[] = [];

    it('increments flowers when hitting points threshold', () => {
      // Threshold is 7. Current 6 + 1 = 7.
      const result = processPlantEvolution(7, 0, 0, 0, forest);
      expect(result.flowers).toBe(1);
      expect(result.plantAccumulatedPoints).toBe(0);
      expect(result.newFlower).toBe(true);
    });

    it('converts flowers to fruit when hitting threshold', () => {
      // Threshold is 4 flowers. Current 3 + 1 new = 4.
      const result = processPlantEvolution(7, 3, 0, 0, forest);
      expect(result.flowers).toBe(0);
      expect(result.fruits).toBe(1);
      expect(result.newFruit).toBe(true);
    });

    it('converts fruits to tree and saves to forest', () => {
      // Threshold is 5 fruits. Current 4 + 1 new = 5.
      const result = processPlantEvolution(7, 3, 4, 0, forest);
      expect(result.fruits).toBe(0);
      expect(result.savedTrees).toBe(1);
      expect(result.newTree).toBe(true);
      expect(result.forestTrees.length).toBe(1);
      expect(result.forestTrees[0].name).toBe('Cây #1');
    });
  });

  describe('Date Helpers', () => {
    it('calculates daysBetween correctly', () => {
      expect(daysBetween('2026-04-01', '2026-04-05')).toBe(4);
      expect(daysBetween('2026-03-31', '2026-04-01')).toBe(1);
    });
  });

});
