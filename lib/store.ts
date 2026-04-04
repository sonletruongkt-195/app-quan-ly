import { UserProfile, DailyEntry, LEVEL_STAGES, BADGES } from './types';

const STORAGE_KEY = 'grow_your_habits_data';

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDefaultProfile(): UserProfile {
  return {
    level: 1,
    stageName: 'Seedling',
    totalXP: 420,
    weeklyXP: 1420,
    streak: 5,
    totalHabitsCompleted: 34,
    history: [],
    badges: [...BADGES],
  };
}

export function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return getDefaultProfile();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const def = getDefaultProfile();
    saveProfile(def);
    return def;
  }
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return getDefaultProfile();
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function getStageInfo(totalXP: number) {
  for (let i = LEVEL_STAGES.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_STAGES[i].minXP) {
      return LEVEL_STAGES[i];
    }
  }
  return LEVEL_STAGES[0];
}

export function getLevelProgress(totalXP: number): number {
  const stage = getStageInfo(totalXP);
  const range = stage.maxXP - stage.minXP;
  const progress = totalXP - stage.minXP;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function getTodayEntry(profile: UserProfile): DailyEntry | null {
  const today = getToday();
  return profile.history.find(h => h.date === today) || null;
}

export function checkAndUnlockBadges(profile: UserProfile): UserProfile {
  const updated = { ...profile };
  updated.badges = [...profile.badges];

  // First win
  const wins = profile.history.filter(h => h.isWin);
  if (wins.length >= 1) {
    const badge = updated.badges.find(b => b.id === 'first-bloom');
    if (badge && !badge.unlocked) { badge.unlocked = true; badge.unlockedAt = getToday(); }
  }
  
  // Streak >= 10
  if (profile.streak >= 10) {
    const badge = updated.badges.find(b => b.id === 'sun-lover');
    if (badge && !badge.unlocked) { badge.unlocked = true; badge.unlockedAt = getToday(); }
  }
  
  // Total habits >= 100
  if (profile.totalHabitsCompleted >= 100) {
    const badge = updated.badges.find(b => b.id === 'task-master');
    if (badge && !badge.unlocked) { badge.unlocked = true; badge.unlockedAt = getToday(); }
  }
  
  // Total XP >= 1000
  if (profile.totalXP >= 1000) {
    const badge = updated.badges.find(b => b.id === 'xp-grinder');
    if (badge && !badge.unlocked) { badge.unlocked = true; badge.unlockedAt = getToday(); }
  }

  return updated;
}
