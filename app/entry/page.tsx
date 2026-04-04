'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { submitDailyEntry, updateUserProfile } from '@/lib/database';
import { isRevenueTargetLocked, getTodayStr, getCurrentMonth } from '@/lib/gameLogic';

const NORMAL_TASKS = 5;
const HARD_TASKS = 2;

export default function EntryPage() {
  const { user, profile, todayEntry, loading, refreshProfile, refreshTodayEntry } = useAuth();
  const router = useRouter();

  const [normalDone, setNormalDone] = useState(0);
  const [hardDone, setHardDone] = useState(0);

  const [dienLanh, setDienLanh] = useState('');
  const [chay, setChay] = useState('');
  const [laiXe, setLaiXe] = useState('');

  const [targetInput, setTargetInput] = useState('');
  const [showTargetLock, setShowTargetLock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (todayEntry) {
      setNormalDone(todayEntry.normalTasksDone);
      setHardDone(todayEntry.hardTasksDone);
      setDienLanh(todayEntry.revenue.dienLanh > 0 ? String(todayEntry.revenue.dienLanh) : '');
      setChay(todayEntry.revenue.chay > 0 ? String(todayEntry.revenue.chay) : '');
      setLaiXe(todayEntry.revenue.laiXe > 0 ? String(todayEntry.revenue.laiXe) : '');
    }
  }, [todayEntry]);

  useEffect(() => {
    if (profile) {
      setTargetInput(profile.dailyRevenueTarget > 0 ? String(profile.dailyRevenueTarget) : '');
    }
  }, [profile]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const revenueTotal = (parseFloat(dienLanh) || 0) + (parseFloat(chay) || 0) + (parseFloat(laiXe) || 0);
  const currentTarget = profile?.dailyRevenueTarget ?? 0;
  const revenuePercent = currentTarget > 0 ? (revenueTotal / currentTarget) * 100 : 0;

  const handleTargetChange = () => {
    if (!profile || !user) return;
    const { locked, daysRemaining } = isRevenueTargetLocked(profile);
    if (locked) {
      setShowTargetLock(true);
      showToast(`🔒 Còn ${daysRemaining} ngày mới được thay đổi mục tiêu`);
      return;
    }
    const val = parseFloat(targetInput);
    if (!val || val <= 0) {
      showToast('Vui lòng nhập mục tiêu hợp lệ (triệu VND)');
      return;
    }
    updateUserProfile(user.id, {
      dailyRevenueTarget: val,
      revenueTargetMonth: getCurrentMonth(),
    }).then(() => {
      refreshProfile();
      showToast(`✅ Đã lưu mục tiêu: ${val}M VND/ngày`);
    });
  };

  const handleSubmit = async () => {
    if (!user || !profile || submitting) return;

    if (todayEntry?.submitted) {
      router.push('/results');
      return;
    }

    if (currentTarget <= 0) {
      showToast('⚠️ Hãy nhập mục tiêu doanh thu trước!');
      return;
    }

    setSubmitting(true);
    try {
      await submitDailyEntry(user.id, profile, {
        normalTasksDone: normalDone,
        hardTasksDone: hardDone,
        revenue: {
          dienLanh: parseFloat(dienLanh) || 0,
          chay: parseFloat(chay) || 0,
          laiXe: parseFloat(laiXe) || 0,
        },
        revenueTarget: currentTarget,
        wateredToday: todayEntry?.wateredToday ?? false,
      });

      await refreshProfile();
      await refreshTodayEntry();

      router.push('/results');
    } catch (e: any) {
      showToast('Lỗi ghi nhận: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const targetLockInfo = isRevenueTargetLocked(profile);
  const isSubmitted = todayEntry?.submitted ?? false;
  const tasksDone = normalDone + hardDone;
  const totalTasks = NORMAL_TASKS + HARD_TASKS;
  const taskPercent = (tasksDone / totalTasks) * 100;

  const today = new Date();
  const dateStr = today.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="pb-32 relative min-h-screen bg-surface">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full text-sm font-bold shadow-lg animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-gradient-to-b from-surface/90 to-surface/40 flex flex-col justify-end px-6 py-6 pb-4 backdrop-blur-md">
        <p className="text-primary font-label text-xs uppercase tracking-widest">{dateStr}</p>
        <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mt-1">Daily Growth</h1>
        <p className="text-on-surface-variant font-body text-sm mt-1 mb-4">Log your achievements to nurture your ecosystem.</p>
        
        {/* Today score preview glass card */}
        <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-4 rounded-2xl flex gap-3 shadow-sm border border-surface-container-highest">
          <div className="flex-1 bg-surface-container-highest/50 rounded-xl py-2 px-3 text-center">
            <span className="block text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Tasks</span>
            <span className="text-lg font-headline font-bold text-on-surface">{Math.round(taskPercent)}%</span>
          </div>
          <div className="flex-1 bg-surface-container-highest/50 rounded-xl py-2 px-3 text-center">
            <span className="block text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Doanh thu</span>
            <span className="text-lg font-headline font-bold text-on-surface">{Math.round(revenuePercent)}%</span>
          </div>
          <div className={`flex-1 rounded-xl py-2 px-3 text-center ${taskPercent + revenuePercent > 100 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest/50'}`}>
            <span className={`block text-[10px] font-label uppercase tracking-widest ${taskPercent + revenuePercent > 100 ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>% Tổng</span>
            <span className={`text-lg font-headline font-bold ${taskPercent + revenuePercent > 100 ? 'text-on-primary' : 'text-on-surface'}`}>{Math.round(taskPercent + revenuePercent)}%</span>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-8 mt-2">
        {/* Zone 1: Tasks */}
        <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg">1</div>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">Nhiệm vụ</h2>
              <p className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Sự chăm chỉ</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Normal Tasks */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-bold text-on-surface">Task bình thường (+1đ)</p>
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{normalDone}/{NORMAL_TASKS}</span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: NORMAL_TASKS }).map((_, i) => {
                  const isChecked = i < normalDone;
                  return (
                    <button
                      key={`normal-${i}`}
                      onClick={() => !isSubmitted && setNormalDone(i < normalDone ? i : i + 1)}
                      disabled={isSubmitted}
                      className={`h-12 flex-1 rounded-xl flex items-center justify-center transition-all ${isChecked ? 'bg-primary text-on-primary shadow-inner shadow-primary/20' : 'bg-surface-container-high text-transparent'}`}
                    >
                      {isChecked && <span className="material-symbols-outlined text-xl">check</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hard Tasks */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-bold text-error">Task khó (+2đ)</p>
                <span className="text-xs font-bold text-error bg-error-container/50 px-2 py-0.5 rounded-full">{hardDone}/{HARD_TASKS}</span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: HARD_TASKS }).map((_, i) => {
                  const isChecked = i < hardDone;
                  return (
                    <button
                      key={`hard-${i}`}
                      onClick={() => !isSubmitted && setHardDone(i < hardDone ? i : i + 1)}
                      disabled={isSubmitted}
                      className={`h-12 flex-1 rounded-xl flex items-center justify-center transition-all ${isChecked ? 'bg-error text-on-error shadow-inner shadow-error/20' : 'bg-error-container/30 text-transparent'}`}
                    >
                      {isChecked && <span className="material-symbols-outlined text-xl">check</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-primary-container/30 px-4 py-3 rounded-xl flex justify-between items-center">
              <span className="text-sm font-bold text-primary">Điểm task: {normalDone * 1 + hardDone * 2}đ</span>
              <span className="text-xs text-on-surface-variant font-medium">Hoàn thành {tasksDone}/{totalTasks}</span>
            </div>
          </div>
        </section>

        {/* Zone 2: Revenue */}
        <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-lg">2</div>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">Doanh số</h2>
              <p className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Sự hiệu quả</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Target Settings */}
            <div className="bg-surface-container-low p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Mục tiêu (Tr VND / Ngày)</h3>
                {!targetLockInfo.locked ? (
                  <button onClick={handleTargetChange} className="text-xs font-bold text-primary bg-primary-container px-3 py-1 rounded-full">Lưu</button>
                ) : (
                  <span className="text-[10px] font-bold text-tertiary bg-tertiary-container/30 px-2 flex items-center gap-1 rounded-full py-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    {targetLockInfo.daysRemaining} ngày
                  </span>
                )}
              </div>
              <div className="flex items-end gap-2 relative z-10">
                <input
                  type="number"
                  value={targetInput}
                  onChange={(e) => !targetLockInfo.locked ? setTargetInput(e.target.value) : null}
                  disabled={targetLockInfo.locked}
                  className="bg-transparent text-4xl font-headline font-extrabold text-on-surface w-24 outline-none placeholder:text-on-surface-variant/30"
                  placeholder="35"
                />
                <span className="text-on-surface-variant font-bold pb-1">M VND</span>
              </div>
              {currentTarget > 0 && <p className="text-[10px] text-on-surface-variant mt-2">Mục tiêu tháng: {currentTarget * 30}M VND</p>}
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              {[
                { id: 'dienLanh', label: 'ĐIỆN LẠNH', value: dienLanh, setter: setDienLanh },
                { id: 'chay', label: 'CHAY', value: chay, setter: setChay },
                { id: 'laiXe', label: 'LÁI XE', value: laiXe, setter: setLaiXe }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between border-b border-surface-container-high focus-within:border-primary pb-2 transition-colors">
                  <label htmlFor={item.id} className="text-sm font-bold text-on-surface">{item.label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      id={item.id}
                      type="number"
                      value={item.value}
                      onChange={e => !isSubmitted && item.setter(e.target.value)}
                      disabled={isSubmitted}
                      className="bg-transparent text-right text-xl font-headline font-bold text-on-surface w-20 outline-none placeholder:text-on-surface-variant/30"
                      placeholder="0"
                      step="0.5"
                      min="0"
                    />
                    <span className="text-on-surface-variant font-bold">M</span>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-label uppercase tracking-widest text-primary">Tổng Cộng</span>
                <div>
                  <span className="text-2xl font-headline font-extrabold text-primary">{revenueTotal.toFixed(1)}</span>
                  <span className="text-sm font-bold text-primary ml-1">M</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {currentTarget > 0 && (
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 transition-colors" style={{ color: revenuePercent >= 100 ? 'var(--color-primary)' : revenuePercent >= 50 ? 'var(--color-tertiary-container)' : 'var(--color-error)' }}>
                  <span>Tiến độ ({Math.round(revenuePercent)}%)</span>
                  <span>{currentTarget}M</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-700" 
                    style={{ 
                      width: `${Math.min(revenuePercent, 100)}%`,
                      backgroundColor: revenuePercent >= 100 ? 'var(--color-primary)' : revenuePercent >= 50 ? 'var(--color-tertiary-container)' : 'var(--color-error)'
                    }}></div>
                </div>
              </div>
            )}
            
            <div className={`px-4 py-3 rounded-xl flex justify-between items-center ${revenuePercent >= 50 ? 'bg-primary-container/30' : 'bg-error-container/30'}`}>
              <span className={`text-sm font-bold ${revenuePercent >= 50 ? 'text-primary' : 'text-error'}`}>
                {revenuePercent >= 50 ? '✅ Điểm doanh thu: +5đ' : `⚠️ Cần ≥ 50% (${(currentTarget * 0.5).toFixed(0)}M)`}
              </span>
            </div>
          </div>
        </section>

        {/* Win Condition Preview */}
        {!isSubmitted && (
          <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container-highest">
            <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-4">🎯 Điều kiện Win hôm nay</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">% Task + % Doanh thu &gt; 100%</span>
                <span className={`text-sm font-bold ${taskPercent + revenuePercent > 100 ? 'text-primary' : 'text-error'}`}>
                  {Math.round(taskPercent + revenuePercent)}% {taskPercent + revenuePercent > 100 ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Tổng điểm ngày &gt; 5đ</span>
                <span className={`text-sm font-bold ${(normalDone * 1 + hardDone * 2 + (revenuePercent >= 50 ? 5 : 0) + (todayEntry?.wateredToday ? 1 : -2)) > 5 ? 'text-primary' : 'text-error'}`}>
                  {(normalDone * 1 + hardDone * 2 + (revenuePercent >= 50 ? 5 : 0) + (todayEntry?.wateredToday ? 1 : -2)).toFixed(1)}đ {(normalDone * 1 + hardDone * 2 + (revenuePercent >= 50 ? 5 : 0) + (todayEntry?.wateredToday ? 1 : -2)) > 5 ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FAB Submit */}
      <div className="fixed bottom-28 left-0 w-full flex justify-center px-6 z-40 pointer-events-none">
        <button 
          onClick={handleSubmit}
          disabled={submitting || isSubmitted}
          className={`pointer-events-auto flex items-center gap-3 px-8 py-4 w-full justify-center rounded-full font-headline font-extrabold shadow-[0_12px_32px_rgba(25,28,27,0.15)] active:scale-95 transition-all duration-300
            ${isSubmitted ? 'bg-secondary-container text-on-secondary-container opacity-90' : 'bg-primary text-on-primary'}
          `}>
          {submitting ? (
            <><span className="material-symbols-outlined animate-spin">sync</span> ĐANG GHI NHẬN...</>
          ) : isSubmitted ? (
            <><span className="material-symbols-outlined fill-1">check_circle</span> ĐÃ GHI NHẬN HÔM NAY</>
          ) : (
            <><span className="material-symbols-outlined fill-1">check_circle</span> UPDATE GREENHOUSE</>
          )}
        </button>
      </div>

      <BottomNav active="/entry" />
    </div>
  );
}
