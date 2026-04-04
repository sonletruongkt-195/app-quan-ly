'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { submitDailyEntry, updateUserProfile, saveDailyEntry } from '@/lib/database';
import { isRevenueTargetLocked, getTodayStr, getCurrentMonth, calculateDayScore } from '@/lib/gameLogic';
import { playSuccess } from '@/lib/audio';

export default function EntryPage() {
  const { user, profile, todayEntry, loading, refreshProfile, refreshTodayEntry } = useAuth();
  const router = useRouter();

  const [normalDone, setNormalDone] = useState(0);
  const [normalTotal, setNormalTotal] = useState(0);
  const [hardDone, setHardDone] = useState(0);
  const [hardTotal, setHardTotal] = useState(0);

  const [normalInput, setNormalInput] = useState('');
  const [hardInput, setHardInput] = useState('');

  const [dienLanh, setDienLanh] = useState('');
  const [chay, setChay] = useState('');
  const [laiXe, setLaiXe] = useState('');

  const [targetInput, setTargetInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (todayEntry) {
      setNormalDone(todayEntry.normalTasksDone);
      setNormalTotal(todayEntry.normalTasksTotal || 0);
      setHardDone(todayEntry.hardTasksDone);
      setHardTotal(todayEntry.hardTasksTotal || 0);
      setDienLanh(todayEntry.revenue.dienLanh > 0 ? String(todayEntry.revenue.dienLanh) : '');
      setChay(todayEntry.revenue.chay > 0 ? String(todayEntry.revenue.chay) : '');
      setLaiXe(todayEntry.revenue.laiXe > 0 ? String(todayEntry.revenue.laiXe) : '');
      
      // Update inputs if not set
      if (todayEntry.normalTasksTotal > 0) setNormalInput(String(todayEntry.normalTasksTotal));
      if (todayEntry.hardTasksTotal > 0) setHardInput(String(todayEntry.hardTasksTotal));
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

  const revenueTotal = useMemo(() => 
    (parseFloat(dienLanh) || 0) + (parseFloat(chay) || 0) + (parseFloat(laiXe) || 0),
  [dienLanh, chay, laiXe]);

  const currentTarget = profile?.dailyRevenueTarget ?? 0;
  const revenuePercent = currentTarget > 0 ? (revenueTotal / currentTarget) * 100 : 0;

  // Real-time score calculation
  const currentStatus = useMemo(() => {
    if (!profile) return null;
    return calculateDayScore(
      todayEntry?.wateredToday ?? false,
      normalDone,
      normalTotal,
      hardDone,
      hardTotal,
      revenueTotal,
      currentTarget,
      profile.currentWinStreak
    );
  }, [profile, todayEntry, normalDone, normalTotal, hardDone, hardTotal, revenueTotal, currentTarget]);

  const handleSetGoals = async () => {
    if (!user || submitting) return;
    const n = parseInt(normalInput) || 0;
    const h = parseInt(hardInput) || 0;
    
    if (n <= 0 && h <= 0) {
      showToast('⚠️ Vui lòng nhập số lượng task!');
      return;
    }

    setSubmitting(true);
    try {
      await saveDailyEntry(user.id, getTodayStr(), {
        normalTasksTotal: n,
        hardTasksTotal: h,
      });
      await refreshTodayEntry();
      setNormalTotal(n);
      setHardTotal(h);
      showToast('✅ Đã khóa mục tiêu công việc hôm nay!');
    } catch (e: any) {
      showToast('Lỗi: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile || submitting) return;

    // We allow re-submission now
    if (currentTarget <= 0) {
      showToast('⚠️ Hãy nhập mục tiêu doanh thu trước!');
      return;
    }

    setSubmitting(true);
    try {
      await submitDailyEntry(user.id, profile, {
        normalTasksDone: normalDone,
        normalTasksTotal: normalTotal,
        hardTasksDone: hardDone,
        hardTasksTotal: hardTotal,
        revenue: {
          dienLanh: parseFloat(dienLanh) || 0,
          chay: parseFloat(chay) || 0,
          laiXe: parseFloat(laiXe) || 0,
        },
        revenueTarget: currentTarget,
        wateredToday: todayEntry?.wateredToday ?? false,
      }, todayEntry); // Added todayEntry parameter

      await refreshProfile();
      await refreshTodayEntry();
      playSuccess();
      showToast('✅ Đã cập nhật kết quả hôm nay!');
    } catch (e: any) {
      showToast('Lỗi ghi nhận: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBox = async (type: 'normal' | 'hard', index: number) => {
    if (!user) return;
    
    let nextDone = 0;
    if (type === 'normal') {
      nextDone = index < normalDone ? index : index + 1;
      setNormalDone(nextDone);
    } else {
      nextDone = index < hardDone ? index : index + 1;
      setHardDone(nextDone);
    }

    // Auto-save progress
    saveDailyEntry(user.id, getTodayStr(), {
      [type === 'normal' ? 'normalTasksDone' : 'hardTasksDone']: nextDone
    });
  };

  const isSubmitted = todayEntry?.submitted ?? false;
  const isGoalsLocked = normalTotal > 0 || hardTotal > 0;
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="pb-60 relative min-h-screen bg-surface">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full text-sm font-bold shadow-lg animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Header: Compact tracking bar */}
      <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-xl px-4 py-3 border-b border-on-surface/5">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-secondary font-label text-[8px] uppercase tracking-[0.2em] font-black mb-0.5">{dateStr}</p>
            <h1 className="text-xl font-headline font-black text-on-surface tracking-tight leading-none">Ghi nhận</h1>
          </div>
          <div className="flex gap-2">
            <div className="bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-primary/10">
              <span className="material-symbols-outlined text-[12px] font-black text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>task</span>
              <span className="text-[10px] font-black text-primary">{Math.round(currentStatus?.taskPercent || 0)}%</span>
            </div>
            <div className="bg-secondary/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-secondary/10">
              <span className="material-symbols-outlined text-[12px] font-black text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <span className="text-[10px] font-black text-secondary">{Math.round(revenuePercent || 0)}%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-4 mt-4">
        {/* Zone 1: Tasks */}
        <section className="bg-surface-container-lowest p-4 rounded-[28px] shadow-sm border border-on-surface/5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-secondary-container/30 text-secondary flex items-center justify-center font-black text-sm border border-secondary/10 shadow-inner">1</div>
            <div>
              <p className="text-[7px] font-label text-on-surface-variant/50 uppercase tracking-[0.1em] font-black">Chăm chỉ</p>
              <h2 className="text-sm font-headline font-black text-on-surface tracking-tight">Nhiệm vụ hàng ngày</h2>
            </div>
          </div>

          {!isGoalsLocked ? (
            <div className="space-y-4 p-2 bg-surface-container/30 rounded-2xl border border-dashed border-on-surface/10">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-on-surface-variant/70 uppercase block mb-1">Số Task Nâng cao (+1)</label>
                  <input 
                    type="number" 
                    value={normalInput}
                    onChange={e => setNormalInput(e.target.value)}
                    placeholder="VD: 5"
                    className="w-full bg-surface p-3 rounded-xl border border-on-surface/10 text-sm font-black focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-on-surface-variant/70 uppercase block mb-1">Cột mốc (+2)</label>
                  <input 
                    type="number" 
                    value={hardInput}
                    onChange={e => setHardInput(e.target.value)}
                    placeholder="VD: 2"
                    className="w-full bg-surface p-3 rounded-xl border border-on-surface/10 text-sm font-black focus:border-error outline-none"
                  />
                </div>
              </div>
              <button 
                onClick={handleSetGoals}
                disabled={submitting}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : 'LÀM VIỆC THÔI! 🚀'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Normal Tasks Grid */}
              {normalTotal > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2.5 px-0.5">
                    <p className="text-[10px] font-black text-on-surface uppercase tracking-tight">Task bình thường (+1đ)</p>
                    <span className="text-[9px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full">{normalDone}/{normalTotal}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: normalTotal }).map((_, i) => {
                      const isChecked = i < normalDone;
                      return (
                        <button
                          key={`normal-${i}`}
                          onClick={() => handleUpdateBox('normal', i)}
                          className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 border-2 
                            ${isChecked ? 'bg-primary border-primary shadow-sm text-on-primary' : 'bg-surface-container-high border-on-surface/5 text-transparent hover:bg-surface-container-highest'}`}
                        >
                          {isChecked && <span className="material-symbols-outlined text-sm font-bold animate-scale-in">check</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hard Tasks Grid */}
              {hardTotal > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2.5 px-0.5">
                    <p className="text-[10px] font-black text-error uppercase tracking-tight">Cột mốc quan trọng (+2đ)</p>
                    <span className="text-[9px] font-black text-error bg-error/10 px-2.5 py-1 rounded-full">{hardDone}/{hardTotal}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: hardTotal }).map((_, i) => {
                      const isChecked = i < hardDone;
                      return (
                        <button
                          key={`hard-${i}`}
                          onClick={() => handleUpdateBox('hard', i)}
                          className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 border-2 
                            ${isChecked ? 'bg-error border-error shadow-sm text-on-error' : 'bg-error-container/10 border-error/5 text-transparent hover:bg-error-container/20'}`}
                        >
                          {isChecked && <span className="material-symbols-outlined text-sm font-bold animate-scale-in">bolt</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Zone 2: Revenue */}
        <section className="bg-surface-container-lowest p-4 rounded-[28px] shadow-sm border border-on-surface/5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center font-black text-sm border border-tertiary/10 shadow-inner">2</div>
            <div>
              <p className="text-[7px] font-label text-on-surface-variant/50 uppercase tracking-[0.1em] font-black">Hiệu quả</p>
              <h2 className="text-sm font-headline font-black text-on-surface tracking-tight">Doanh số thực tế</h2>
            </div>
          </div>

          <div className="space-y-3">
             {/* Revenue Target Mini Card */}
             <div className="bg-surface-container p-4 rounded-2xl flex justify-between items-center group">
              <div>
                <h3 className="text-[8px] font-label text-on-surface-variant uppercase tracking-widest font-black mb-0.5">Mục tiêu ngày</h3>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={targetInput}
                    onChange={(e) => !isRevenueTargetLocked(profile!).locked ? setTargetInput(e.target.value) : null}
                    className="bg-transparent text-xl font-headline font-black text-on-surface w-16 outline-none"
                    placeholder="30"
                  />
                  <span className="text-[10px] font-black text-on-surface-variant/40 uppercase">MIL</span>
                </div>
              </div>
              {isRevenueTargetLocked(profile!).locked ? (
                <span className="text-[8px] font-black text-tertiary bg-tertiary/10 px-2 py-1 rounded-lg border border-tertiary/10 uppercase tracking-tighter flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px] font-black">lock</span> {isRevenueTargetLocked(profile!).daysRemaining}D
                </span>
              ) : (
                <button onClick={() => {
                  updateUserProfile(user!.id, { dailyRevenueTarget: parseFloat(targetInput), revenueTargetMonth: getCurrentMonth() }).then(() => {
                    refreshProfile();
                    showToast('✅ Đã lưu mục tiêu!');
                  });
                }} className="text-[8px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/10 hover:bg-primary/20">SAVE</button>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 gap-2 mt-2">
              {[
                { id: 'dienLanh', label: 'Điện lạnh', value: dienLanh, setter: setDienLanh, icon: 'ac_unit', color: 'text-sky-500' },
                { id: 'chay', label: 'Đồ Chay', value: chay, setter: setChay, icon: 'eco', color: 'text-emerald-500' },
                { id: 'laiXe', label: 'Lái xe', value: laiXe, setter: setLaiXe, icon: 'directions_car', color: 'text-amber-500' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between bg-surface-container/20 p-3 rounded-xl border border-on-surface/5">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${item.color} font-black`}>{item.icon}</span>
                    <label htmlFor={item.id} className="text-[10px] font-black text-on-surface uppercase">{item.label}</label>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      id={item.id}
                      type="number"
                      value={item.value}
                      onChange={e => item.setter(e.target.value)}
                      className="bg-transparent text-right text-base font-headline font-black text-on-surface w-16 outline-none"
                      placeholder="0"
                    />
                    <span className="text-[8px] font-black text-on-surface-variant/40">M</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Display */}
            <div className="flex justify-between items-center p-1 mt-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Tổng thực đạt</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-headline font-black text-primary">{revenueTotal.toFixed(1)}</span>
                <span className="text-[10px] font-black text-primary/60">M</span>
              </div>
            </div>
          </div>
        </section>

        {/* Win Condition Summary */}
        <section className={`p-4 rounded-3xl border transition-all duration-500 ${currentStatus?.isWin ? 'bg-primary/5 border-primary/20' : 'bg-error/5 border-error/20'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface/70 mb-1">Trạng thái hiện tại</h3>
              <p className="text-xs font-black text-on-surface-variant">
                Score: <span className={currentStatus?.totalDayScore! > 5 ? 'text-primary' : 'text-error'}>{currentStatus?.totalDayScore.toFixed(1)}đ</span> • 
              Goals: <span className={currentStatus?.goalPercent! >= 50 ? 'text-primary' : 'text-error'}>{Math.round(currentStatus?.goalPercent || 0)}%</span>
              </p>
            </div>
            <div className={`px-4 py-2 rounded-2xl font-black text-xs shadow-sm ${currentStatus?.isWin ? 'bg-primary text-on-primary' : 'bg-error text-on-error'}`}>
              {currentStatus?.isWin ? 'WINNING 🏆' : 'LOSING 💩'}
            </div>
          </div>
        </section>
      </main>

      {/* Action Button: Compact Pill */}
      <div className="fixed bottom-24 left-0 w-full flex justify-center px-6 z-40">
        <button 
          onClick={handleSubmit}
          disabled={submitting || !isGoalsLocked}
          className={`h-14 px-10 rounded-full font-headline font-black shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3
            ${!isGoalsLocked ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed' :
              currentStatus?.isWin ? 'bg-primary text-on-primary' : 'bg-error text-on-error'}
          `}>
          {submitting ? (
            <span className="material-symbols-outlined animate-spin">sync</span>
          ) : (
            <><span className="material-symbols-outlined font-black">verified</span> {isSubmitted ? 'CẬP NHẬT KẾT QUẢ' : (currentStatus?.isWin ? 'CHỐT NGÀY THẮNG LỢI' : 'CHỐT NGÀY THẤT BẠI')}</>
          )}
        </button>
      </div>

      <BottomNav active="/entry" />
    </div>
  );
}
