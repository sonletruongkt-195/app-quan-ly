import { UserProfile, DailyEntry, PlantEvolutionResult, DayScoreResult, ForestTree, PlantStage } from './types';

const TOTAL_TASKS = 7; // 5 normal + 2 hard
const NORMAL_TASKS = 5;
const HARD_TASKS = 2;
const PLANT_FLOWER_THRESHOLD = 7; // accumulated watering pts to get 1 flower
const FLOWERS_PER_FRUIT = 4;
const FRUITS_PER_TREE = 5;
const WIN_SCORE_THRESHOLD = 5;
const WIN_PERCENT_THRESHOLD = 50; // New threshold for the average percentage? No, let's keep it 100 but check logic
const STREAK_WIN_LENGTH = 3;
const STREAK_MULTIPLIER = 1.2;
const LIFE_SAVER_COST = 10; // total game pts to revive dead plant
const REVENUE_BONUS_THRESHOLD = 0.5; // 50% of target
const REVENUE_BONUS_PTS = 5;

// Get today's date string 'YYYY-MM-DD'
export function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Get current month string 'YYYY-MM'
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Days difference between two date strings (b - a, both 'YYYY-MM-DD')
export function daysBetween(a: string, b: string): number {
  const dateA = new Date(a + 'T00:00:00');
  const dateB = new Date(b + 'T00:00:00');
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

// Get last N days as date strings (oldest → newest), including today
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return dates;
}

// Get full calendar grid for a specific month (42 days to fill 6 weeks)
export function getCalendarGrid(year: number, month: number): { date: string, isCurrentMonth: boolean, day: number }[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Day of week of first day (0-6, 0=Sun)
  const startDay = firstDayOfMonth.getDay();
  
  const days: { date: string, isCurrentMonth: boolean, day: number }[] = [];
  
  // Padding from previous month
  const prevMonthLastDay = new Date(year, month, 0);
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
    days.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      isCurrentMonth: false,
      day: d.getDate()
    });
  }
  
  // Days of current month
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: true,
      day: i
    });
  }
  
  // Padding for next month to reach 42 days (6 weeks)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      isCurrentMonth: false,
      day: i
    });
  }
  
  return days;
}

export function getMonthName(date: Date): string {
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

// Format date for display
export function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

// Get day label M/T/W/T/F/S/S
const DAY_LABELS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return DAY_LABELS_VI[d.getDay()];
}

// Calculate plant stage
export function getPlantStage(profile: UserProfile): PlantStage {
  if (profile.isPlantDead) return 'dead';
  if (profile.fruits > 0) return 'fruiting';
  if (profile.flowers > 0) return 'blooming';
  return 'seedling';
}

export function getPlantImage(stage: PlantStage): string {
  switch (stage) {
    case 'dead': return '/plants/seedling.png'; // show wilted/seedling
    case 'seedling': return '/plants/seedling.png';
    case 'blooming': return '/plants/blooming.png';
    case 'fruiting': return '/plants/fruiting.png';
    default: return '/plants/seedling.png';
  }
}

export function getPlantStageName(profile: UserProfile): string {
  if (profile.isPlantDead) return 'Cây đã chết 💀';
  if (profile.fruits >= 4) return 'Stage: Quả sắp thành Cây 🌳';
  if (profile.fruits > 0) return `Stage: Có ${profile.fruits} 🍎 Quả`;
  if (profile.flowers >= 3) return `Stage: Hoa nở rộ 🌸`;
  if (profile.flowers > 0) return `Stage: Có ${profile.flowers} 🌸 Hoa`;
  if (profile.plantAccumulatedPoints >= 5) return 'Stage: Cây con lớn 🌿';
  return 'Stage: Cây non 🌱';
}

// Calculate streak multiplier
export function getStreakMultiplier(winStreak: number): number {
  if (winStreak >= 7) return 1.5;
  if (winStreak >= 3) return 1.2;
  return 1.0;
}

// Process plant evolution after gaining 1 watering point
export function processPlantEvolution(
  plantAccumulatedPoints: number,
  flowers: number,
  fruits: number,
  savedTrees: number,
  forestTrees: ForestTree[]
): PlantEvolutionResult {
  let pts = plantAccumulatedPoints;
  let fls = flowers;
  let frs = fruits;
  let trees = savedTrees;
  let ft = [...forestTrees];
  let newFlower = false;
  let newFruit = false;
  let newTree = false;

  // Check if watering points hit flower threshold
  if (pts >= PLANT_FLOWER_THRESHOLD) {
    pts = 0; // reset
    fls += 1;
    newFlower = true;
  }

  // Check flower → fruit conversion (auto)
  if (fls >= FLOWERS_PER_FRUIT) {
    fls -= FLOWERS_PER_FRUIT;
    frs += 1;
    newFruit = true;
  }

  // Check fruit → tree conversion (auto)
  if (frs >= FRUITS_PER_TREE) {
    frs -= FRUITS_PER_TREE;
    trees += 1;
    newTree = true;
    ft.push({
      id: Date.now().toString(),
      savedAt: getTodayStr(),
      name: `Cây #${trees}`,
    });
  }

  return {
    plantAccumulatedPoints: pts,
    flowers: fls,
    fruits: frs,
    savedTrees: trees,
    forestTrees: ft,
    newFlower,
    newFruit,
    newTree,
  };
}

// Calculate daily score on submit
export function calculateDayScore(
  wateredToday: boolean,
  normalTasksDone: number,
  normalTasksTotal: number,
  hardTasksDone: number,
  hardTasksTotal: number,
  revenueTotal: number,
  revenueTarget: number,
  currentWinStreak: number,
  challengeBonus: number = 0,
  challengeId?: number
): DayScoreResult {
  const wateringPts = wateredToday ? 1 : -2;

  const rawTaskPts = (normalTasksDone * 1) + (hardTasksDone * 2);
  const rawRevenuePts = (revenueTarget > 0 && revenueTotal >= revenueTarget * REVENUE_BONUS_THRESHOLD)
    ? REVENUE_BONUS_PTS : 0;

  const streakMultiplier = getStreakMultiplier(currentWinStreak);
  const taskPts = rawTaskPts * streakMultiplier;
  const revenuePts = rawRevenuePts * streakMultiplier;

  // 🎯 Calculate earned challenge bonus
  let earnedChallengeBonus = 0;
  if (challengeId && challengeBonus > 0) {
    const normalMet = normalTasksTotal > 0 && normalTasksDone >= normalTasksTotal;
    const hardMet = hardTasksTotal > 0 && hardTasksDone >= hardTasksTotal;

    if (challengeId === 1 && normalMet) earnedChallengeBonus = challengeBonus;
    else if (challengeId === 2 && hardMet) earnedChallengeBonus = challengeBonus;
    else if (challengeId === 3 && normalMet && hardMet) earnedChallengeBonus = challengeBonus;
  }

  const totalDayScore = wateringPts + taskPts + revenuePts + earnedChallengeBonus;

  const tasksDone = normalTasksDone + hardTasksDone;
  const totalTasks = (normalTasksTotal || 0) + (hardTasksTotal || 0);
  const taskPercent = totalTasks > 0 ? (tasksDone / totalTasks) * 100 : 0;
  const revenuePercent = revenueTarget > 0 ? (revenueTotal / revenueTarget) * 100 : 0;

  const goalPercent = (taskPercent + revenuePercent) / 2;
  const isWin = totalDayScore >= WIN_SCORE_THRESHOLD && goalPercent >= 50;

  return {
    wateringPts,
    taskPts,
    revenuePts,
    streakMultiplier,
    totalDayScore,
    taskPercent,
    revenuePercent,
    goalPercent,
    isWin,
  };
}

// Process missed days penalty when user opens app
// Returns updates to apply to profile
export function processMissedDays(profile: UserProfile): Partial<UserProfile> {
  const today = getTodayStr();

  // Already checked today
  if (profile.lastOpenedDate === today) return {};

  const updates: Partial<UserProfile> = { lastOpenedDate: today };

  // No previous data - first time opening
  if (!profile.lastOpenedDate) {
    return updates;
  }

  // Calculate days since last open
  const daysSinceOpen = daysBetween(profile.lastOpenedDate, today);
  if (daysSinceOpen <= 0) return updates;

  // Check if the user watered on the last opened date
  // We can't check directly without fetching daily entries
  // So we use lastWateredDate to figure out missed days
  if (!profile.lastWateredDate) {
    // Never watered, no penalties yet
    return updates;
  }

  // Days since last watering (not counting today)
  const daysSinceWater = daysBetween(profile.lastWateredDate, today);
  // Missed days = days after last watering, before today
  const missedDays = Math.max(0, daysSinceWater - 1);

  if (missedDays === 0) {
    return { ...updates, consecutiveMissedDays: 0 };
  }

  // 3+ consecutive missed days → FULL RESET
  if (missedDays >= 3) {
    return {
      ...updates,
      plantAccumulatedPoints: 0,
      flowers: 0,
      fruits: 0,
      isPlantDead: false, // reset also kills/revives
      consecutiveMissedDays: 0,
    };
  }

  // Apply -2pt per missed day to plant accumulated points
  const penalty = missedDays * 2;
  const newPlantPts = profile.plantAccumulatedPoints - penalty;
  const newTotalPts = Math.max(0, profile.totalGamePoints - penalty);

  return {
    ...updates,
    plantAccumulatedPoints: newPlantPts,
    isPlantDead: newPlantPts < 0 || profile.isPlantDead,
    totalGamePoints: newTotalPts,
    consecutiveMissedDays: missedDays,
  };
}

// Can user revive plant?
export function canRevivePlant(profile: UserProfile): boolean {
  return profile.isPlantDead && profile.totalGamePoints >= LIFE_SAVER_COST;
}

// Revive plant (spend 10 total game pts)
export function revivePlant(profile: UserProfile): Partial<UserProfile> {
  if (!canRevivePlant(profile)) return {};
  return {
    isPlantDead: false,
    plantAccumulatedPoints: 0,
    totalGamePoints: profile.totalGamePoints - LIFE_SAVER_COST,
    consecutiveMissedDays: 0,
  };
}

// Check if revenue target is locked for this month
export function isRevenueTargetLocked(profile: UserProfile): { locked: boolean; daysRemaining: number } {
  const currentMonth = getCurrentMonth();
  if (!profile.revenueTargetMonth || profile.revenueTargetMonth !== currentMonth) {
    return { locked: false, daysRemaining: 0 };
  }
  // Calculate days remaining in this month
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = lastDay.getDate() - now.getDate();
  return { locked: true, daysRemaining };
}
