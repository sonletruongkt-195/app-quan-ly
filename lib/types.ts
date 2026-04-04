// Removed Firebase Timestamp import
export type Timestamp = string; // ISO string 2026-04-04T07:55:00Z

export interface ForestTree {
  id: string;
  savedAt: string; // 'YYYY-MM-DD'
  name: string;    // e.g. "Cây #1"
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;

  // Plant watering accumulated points (resets to 0 when reaching 7)
  plantAccumulatedPoints: number;
  flowers: number;   // current flowers (4 → 1 fruit auto)
  fruits: number;    // current fruits (5 → 1 tree auto)
  savedTrees: number;
  forestTrees: ForestTree[];
  isPlantDead: boolean;

  // Tracking watering
  lastWateredDate: string | null;  // 'YYYY-MM-DD'
  lastOpenedDate: string | null;   // 'YYYY-MM-DD'
  consecutiveMissedDays: number;

  // Total accumulated game points (all points ever: watering + tasks + revenue)
  totalGamePoints: number;

  // Win streak
  currentWinStreak: number;
  longestWinStreak: number;

  // Monthly revenue target (locked once per month)
  dailyRevenueTarget: number; // in million VND
  revenueTargetMonth: string; // 'YYYY-MM' - month this target was set

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface DailyRevenue {
  dienLanh: number;
  chay: number;
  laiXe: number;
}

export interface DailyEntry {
  date: string; // 'YYYY-MM-DD'

  // Watering
  wateredToday: boolean;
  wateredAt: Timestamp | null;

  // Tasks (checkboxes)
  normalTasksDone: number; 
  normalTasksTotal: number;
  hardTasksDone: number;
  hardTasksTotal: number;

  // Revenue
  revenue: DailyRevenue;
  revenueTotal: number;
  revenueTarget: number; // snapshot of daily target at time of submission

  // Results (calculated on submit)
  submitted: boolean;
  submittedAt: Timestamp | null;
  wateringPts: number;
  taskPts: number;
  revenuePts: number;
  streakMultiplier: number;
  totalDayScore: number;
  taskPercent: number;
  revenuePercent: number;
  isWin: boolean;
}

export const DEFAULT_PROFILE: Omit<UserProfile, 'uid' | 'displayName' | 'email' | 'photoURL' | 'createdAt' | 'updatedAt'> = {
  plantAccumulatedPoints: 0,
  flowers: 0,
  fruits: 0,
  savedTrees: 0,
  forestTrees: [],
  isPlantDead: false,
  lastWateredDate: null,
  lastOpenedDate: null,
  consecutiveMissedDays: 0,
  totalGamePoints: 0,
  currentWinStreak: 0,
  longestWinStreak: 0,
  dailyRevenueTarget: 0,
  revenueTargetMonth: '',
};

export const DEFAULT_DAILY_ENTRY: Omit<DailyEntry, 'date'> = {
  wateredToday: false,
  wateredAt: null,
  normalTasksDone: 0,
  normalTasksTotal: 0,
  hardTasksDone: 0,
  hardTasksTotal: 0,
  revenue: { dienLanh: 0, chay: 0, laiXe: 0 },
  revenueTotal: 0,
  revenueTarget: 0,
  submitted: false,
  submittedAt: null,
  wateringPts: 0,
  taskPts: 0,
  revenuePts: 0,
  streakMultiplier: 1.0,
  totalDayScore: 0,
  taskPercent: 0,
  revenuePercent: 0,
  isWin: false,
};

export type PlantStage = 'dead' | 'seedling' | 'blooming' | 'fruiting';

export interface PlantEvolutionResult {
  plantAccumulatedPoints: number;
  flowers: number;
  fruits: number;
  savedTrees: number;
  forestTrees: ForestTree[];
  newFlower: boolean;
  newFruit: boolean;
  newTree: boolean;
}

export interface DayScoreResult {
  wateringPts: number;
  taskPts: number;
  revenuePts: number;
  streakMultiplier: number;
  totalDayScore: number;
  taskPercent: number;
  revenuePercent: number;
  isWin: boolean;
}
