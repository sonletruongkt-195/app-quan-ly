import { supabase } from './supabaseClient';
import { UserProfile, DailyEntry, DEFAULT_PROFILE, DEFAULT_DAILY_ENTRY, ForestTree } from './types';
import {
  getTodayStr, getCurrentMonth, processPlantEvolution,
  calculateDayScore, processMissedDays
} from './gameLogic';

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────────

function profileFromDB(dbData: any): UserProfile {
  return {
    ...dbData,
    uid: dbData.id, // Supabase id is the uid
    plantAccumulatedPoints: dbData.plant_accumulated_points,
    savedTrees: dbData.saved_trees,
    forestTrees: dbData.forest_trees || [],
    isPlantDead: dbData.is_plant_dead,
    lastWateredDate: dbData.last_watered_date,
    lastOpenedDate: dbData.last_opened_date,
    consecutiveMissedDays: dbData.consecutive_missed_days,
    totalGamePoints: dbData.total_game_points,
    currentWinStreak: dbData.current_win_streak,
    longestWinStreak: dbData.longest_win_streak,
    dailyRevenueTarget: Number(dbData.daily_revenue_target),
    revenueTargetMonth: dbData.revenue_target_month,
    totalDiamonds: dbData.total_diamonds || 0,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
  };
}

function entryFromDB(dbData: any): DailyEntry {
  return {
    ...dbData,
    wateredToday: dbData.watered_today,
    wateredAt: dbData.watered_at,
    normalTasksDone: dbData.normal_tasks_done || 0,
    normalTasksTotal: dbData.normal_tasks_total || 0,
    hardTasksDone: dbData.hard_tasks_done || 0,
    hardTasksTotal: dbData.hard_tasks_total || 0,
    revenue: {
      dienLanh: Number(dbData.revenue_dien_lanh),
      chay: Number(dbData.revenue_chay),
      laiXe: Number(dbData.revenue_lai_xe),
    },
    revenueTotal: Number(dbData.revenue_total),
    revenueTarget: Number(dbData.revenue_target),
    submittedAt: dbData.submitted_at,
    wateringPts: dbData.watering_pts,
    taskPts: Number(dbData.task_pts),
    revenuePts: Number(dbData.revenue_pts),
    streakMultiplier: Number(dbData.streak_multiplier),
    totalDayScore: Number(dbData.total_day_score),
    taskPercent: Number(dbData.task_percent),
    revenuePercent: Number(dbData.revenue_percent),
    isWin: dbData.is_win,
    challengeId: dbData.challenge_id || null,
    challengeStatus: dbData.challenge_status || 'none',
    challengeBonus: dbData.challenge_bonus || 0,
  };
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  if (error || !data) return null;
  
  // also fetch forest trees
  const { data: trees } = await supabase
    .from('forest_trees')
    .select('*')
    .eq('profile_id', uid);

  return profileFromDB({ ...data, forest_trees: trees || [] });
}

export async function createUserProfile(
  uid: string,
  data: { displayName: string; email: string; photoURL: string }
): Promise<UserProfile> {
  const profileData = {
    id: uid,
    display_name: data.displayName,
    email: data.email,
    photo_url: data.photoURL,
    plant_accumulated_points: DEFAULT_PROFILE.plantAccumulatedPoints,
    flowers: DEFAULT_PROFILE.flowers,
    fruits: DEFAULT_PROFILE.fruits,
    saved_trees: DEFAULT_PROFILE.savedTrees,
    is_plant_dead: DEFAULT_PROFILE.isPlantDead,
    consecutive_missed_days: DEFAULT_PROFILE.consecutiveMissedDays,
    total_game_points: DEFAULT_PROFILE.totalGamePoints,
    current_win_streak: DEFAULT_PROFILE.currentWinStreak,
    longest_win_streak: DEFAULT_PROFILE.longestWinStreak,
    daily_revenue_target: DEFAULT_PROFILE.dailyRevenueTarget,
    revenue_target_month: DEFAULT_PROFILE.revenueTargetMonth,
    total_diamonds: DEFAULT_PROFILE.totalDiamonds,
  };

  const { error } = await supabase.from('profiles').upsert(profileData);
  if (error) throw error;

  return getUserProfile(uid) as Promise<UserProfile>;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const dbUpdates: any = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.photoURL !== undefined) dbUpdates.photo_url = updates.photoURL;
  if (updates.plantAccumulatedPoints !== undefined) dbUpdates.plant_accumulated_points = updates.plantAccumulatedPoints;
  if (updates.flowers !== undefined) dbUpdates.flowers = updates.flowers;
  if (updates.fruits !== undefined) dbUpdates.fruits = updates.fruits;
  if (updates.savedTrees !== undefined) dbUpdates.saved_trees = updates.savedTrees;
  if (updates.isPlantDead !== undefined) dbUpdates.is_plant_dead = updates.isPlantDead;
  if (updates.lastWateredDate !== undefined) dbUpdates.last_watered_date = updates.lastWateredDate;
  if (updates.lastOpenedDate !== undefined) dbUpdates.last_opened_date = updates.lastOpenedDate;
  if (updates.consecutiveMissedDays !== undefined) dbUpdates.consecutive_missed_days = updates.consecutiveMissedDays;
  if (updates.totalGamePoints !== undefined) dbUpdates.total_game_points = updates.totalGamePoints;
  if (updates.currentWinStreak !== undefined) dbUpdates.current_win_streak = updates.currentWinStreak;
  if (updates.longestWinStreak !== undefined) dbUpdates.longest_win_streak = updates.longestWinStreak;
  if (updates.dailyRevenueTarget !== undefined) dbUpdates.daily_revenue_target = updates.dailyRevenueTarget;
  if (updates.revenueTargetMonth !== undefined) dbUpdates.revenue_target_month = updates.revenueTargetMonth;
  if (updates.totalDiamonds !== undefined) dbUpdates.total_diamonds = updates.totalDiamonds;
  
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', uid);
  if (error) throw error;
}

// ─── Daily Entry ──────────────────────────────────────────────────────────────

export async function getDailyEntry(uid: string, date: string): Promise<DailyEntry | null> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('profile_id', uid)
    .eq('date', date)
    .maybeSingle();

  if (error || !data) return null;
  return entryFromDB(data);
}

export async function saveDailyEntry(
  uid: string,
  date: string,
  data: Partial<DailyEntry>
): Promise<void> {
  const dbData: any = { profile_id: uid, date };
  
  if (data.wateredToday !== undefined) dbData.watered_today = data.wateredToday;
  if (data.wateredAt !== undefined) dbData.watered_at = data.wateredAt;
  if (data.normalTasksDone !== undefined) dbData.normal_tasks_done = data.normalTasksDone;
  if (data.normalTasksTotal !== undefined) dbData.normal_tasks_total = data.normalTasksTotal;
  if (data.hardTasksDone !== undefined) dbData.hard_tasks_done = data.hardTasksDone;
  if (data.hardTasksTotal !== undefined) dbData.hard_tasks_total = data.hardTasksTotal;
  if (data.revenue !== undefined) {
    dbData.revenue_dien_lanh = data.revenue.dienLanh;
    dbData.revenue_chay = data.revenue.chay;
    dbData.revenue_lai_xe = data.revenue.laiXe;
  }
  if (data.revenueTotal !== undefined) dbData.revenue_total = data.revenueTotal;
  if (data.revenueTarget !== undefined) dbData.revenue_target = data.revenueTarget;
  if (data.submitted !== undefined) dbData.submitted = data.submitted;
  if (data.submittedAt !== undefined) dbData.submitted_at = data.submittedAt;
  if (data.wateringPts !== undefined) dbData.watering_pts = data.wateringPts;
  if (data.taskPts !== undefined) dbData.task_pts = data.taskPts;
  if (data.revenuePts !== undefined) dbData.revenue_pts = data.revenuePts;
  if (data.streakMultiplier !== undefined) dbData.streak_multiplier = data.streakMultiplier;
  if (data.totalDayScore !== undefined) dbData.total_day_score = data.totalDayScore;
  if (data.taskPercent !== undefined) dbData.task_percent = data.taskPercent;
  if (data.revenuePercent !== undefined) dbData.revenue_percent = data.revenuePercent;
  if (data.isWin !== undefined) dbData.is_win = data.isWin;
  
  if (data.challengeId !== undefined) dbData.challenge_id = data.challengeId;
  if (data.challengeStatus !== undefined) dbData.challenge_status = data.challengeStatus;
  if (data.challengeBonus !== undefined) dbData.challenge_bonus = data.challengeBonus;

  const { error } = await supabase.from('daily_entries').upsert(dbData, { onConflict: 'profile_id, date' });
  if (error) throw error;
}

export async function getRecentEntries(uid: string, days: number = 7): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('profile_id', uid)
    .order('date', { ascending: false })
    .limit(days);

  if (error || !data) return [];
  return data.map(entryFromDB).reverse();
}

export async function getAllEntries(uid: string): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('profile_id', uid)
    .order('date', { ascending: true });

  if (error || !data) return [];
  return data.map(entryFromDB);
}

export async function getEntriesByDateRange(uid: string, startDate: string, endDate: string): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('profile_id', uid)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error || !data) return [];
  return data.map(entryFromDB);
}

// ─── Water Plant ──────────────────────────────────────────────────────────────

export async function waterPlant(uid: string, profile: UserProfile, todayEntry: DailyEntry | null): Promise<{
  profile: UserProfile;
  evolution: { newFlower: boolean; newFruit: boolean; newTree: boolean };
}> {
  const today = getTodayStr();

  if (todayEntry?.wateredToday) {
    throw new Error('Đã tưới cây hôm nay rồi!');
  }

  // +1 to plant accumulated points
  const newPtsBefore = profile.plantAccumulatedPoints + 1;

  // Process evolution
  const evo = processPlantEvolution(
    newPtsBefore,
    profile.flowers,
    profile.fruits,
    profile.savedTrees,
    profile.forestTrees
  );

  // Update daily entry
  await saveDailyEntry(uid, today, {
    wateredToday: true,
    wateredAt: new Date().toISOString(),
    wateringPts: 1,
  });

  // Handle New Tree in forest_trees table if needed
  if (evo.newTree) {
    const treeName = `Cây #${evo.savedTrees}`;
    await supabase.from('forest_trees').insert({
      profile_id: uid,
      name: treeName,
      saved_at: today
    });
  }

  // Update profile
  const profileUpdates: Partial<UserProfile> = {
    plantAccumulatedPoints: evo.plantAccumulatedPoints,
    flowers: evo.flowers,
    fruits: evo.fruits,
    savedTrees: evo.savedTrees,
    // Note: forestTrees is fetched separately in getUserProfile
    lastWateredDate: today,
    consecutiveMissedDays: 0,
    totalGamePoints: profile.totalGamePoints + 1,
  };

  await updateUserProfile(uid, profileUpdates);

  const updatedProfile = { ...profile, ...profileUpdates };

  return {
    profile: updatedProfile,
    evolution: { newFlower: evo.newFlower, newFruit: evo.newFruit, newTree: evo.newTree },
  };
}

// ─── Submit Daily Entry ───────────────────────────────────────────────────────

export async function submitDailyEntry(
  uid: string,
  _staleProfile: UserProfile, // keep parameter for signature compatibility if needed, but we'll fetch fresh
  entry: {
    normalTasksDone: number;
    normalTasksTotal: number;
    hardTasksDone: number;
    hardTasksTotal: number;
    revenue: { dienLanh: number; chay: number; laiXe: number };
    revenueTarget: number;
    wateredToday: boolean;
  },
  todayEntry: DailyEntry | null // Added parameter
) : Promise<{ dayScore: ReturnType<typeof calculateDayScore>; updatedProfile: UserProfile }> {
  // Fetch FRESH profile to avoid state sync issues
  const profile = await getUserProfile(uid);
  if (!profile) throw new Error("Profile not found");

  const today = getTodayStr();
  const revenueTotal = entry.revenue.dienLanh + entry.revenue.chay + entry.revenue.laiXe;

  // Calculate base streak (streak before today's results)
  const baseStreak = todayEntry?.submitted 
    ? (todayEntry.isWin ? Math.max(0, profile.currentWinStreak - 1) : profile.currentWinStreak)
    : profile.currentWinStreak;

  const { taskPercent, revenuePercent, totalDayScore, isWin, ...scores } = calculateDayScore(
    entry.wateredToday,
    entry.normalTasksDone,
    entry.normalTasksTotal || 0,
    entry.hardTasksDone,
    entry.hardTasksTotal || 0,
    revenueTotal,
    entry.revenueTarget,
    baseStreak,
    todayEntry?.challengeBonus || 0,
    todayEntry?.challengeId || 0
  );

  const dayScore = { taskPercent, revenuePercent, totalDayScore, isWin, ...scores };

  // Update win streak correctly based on the base streak
  let newStreak = dayScore.isWin ? baseStreak + 1 : 0;
  const newLongest = Math.max(profile.longestWinStreak, newStreak);

  const submitPts = dayScore.taskPts + dayScore.revenuePts;

  // Save entry
  await saveDailyEntry(uid, today, {
    normalTasksDone: entry.normalTasksDone,
    normalTasksTotal: entry.normalTasksTotal || 0,
    hardTasksDone: entry.hardTasksDone,
    hardTasksTotal: entry.hardTasksTotal || 0,
    revenue: entry.revenue,
    revenueTotal,
    revenueTarget: entry.revenueTarget,
    submitted: true,
    submittedAt: new Date().toISOString(),
    wateringPts: entry.wateredToday ? 1 : -2,
    taskPts: dayScore.taskPts,
    revenuePts: dayScore.revenuePts,
    streakMultiplier: dayScore.streakMultiplier,
    totalDayScore: dayScore.totalDayScore,
    taskPercent: dayScore.taskPercent,
    revenuePercent: dayScore.revenuePercent,
    isWin: dayScore.isWin,
    challengeBonus: todayEntry?.challengeBonus || 0,
  });

  // Update profile
  const profileUpdates: Partial<UserProfile> = {
    currentWinStreak: newStreak,
    longestWinStreak: newLongest,
    totalGamePoints: Math.max(0, profile.totalGamePoints + submitPts + (todayEntry?.challengeBonus || 0)),
  };

  // 💎 Diamond Tracking
  const prevMet = todayEntry?.submitted && todayEntry.revenueTotal >= todayEntry.revenueTarget && todayEntry.revenueTarget > 0;
  const nowMet = revenueTotal >= entry.revenueTarget && entry.revenueTarget > 0;
  
  if (!prevMet && nowMet) {
    profileUpdates.totalDiamonds = (profile.totalDiamonds || 0) + 1;
  } else if (prevMet && !nowMet) {
    profileUpdates.totalDiamonds = Math.max(0, (profile.totalDiamonds || 0) - 1);
  }

  // If not watered today, apply -2 penalty to plant
  if (!entry.wateredToday) {
    const newPlantPts = profile.plantAccumulatedPoints - 2;
    profileUpdates.plantAccumulatedPoints = newPlantPts;
    profileUpdates.isPlantDead = newPlantPts < 0 || profile.isPlantDead;
    profileUpdates.consecutiveMissedDays = profile.consecutiveMissedDays + 1;
  }

  await updateUserProfile(uid, profileUpdates);

  const updatedProfile = { ...profile, ...profileUpdates };

  return { dayScore, updatedProfile };
}

// ─── Initialize / Missed Days Check ──────────────────────────────────────────

export async function initializeUserDay(uid: string, profile: UserProfile): Promise<UserProfile> {
  const updates = processMissedDays(profile);
  if (Object.keys(updates).length === 0) return profile;

  await updateUserProfile(uid, updates);
  return { ...profile, ...updates };
}
