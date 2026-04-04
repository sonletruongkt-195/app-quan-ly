'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyChallengeModalProps {
  isOpen: boolean;
  type: number; // 1, 2, 3
  baseNormal: number;
  baseHard: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function DailyChallengeModal({ isOpen, type, baseNormal, baseHard, onAccept, onDecline }: DailyChallengeModalProps) {
  if (!isOpen) return null;

  const getChallengeText = () => {
    switch (type) {
      case 1: return {
        title: "Gấp Đôi Nỗ Lực!",
        desc: `Thử thách bạn hoàn thành ${baseNormal * 2} nhiệm vụ bình thường trong hôm nay.`,
        icon: "⚡"
      };
      case 2: return {
        title: "Chinh Phục Cột Mốc!",
        desc: `Người hùng! Bạn có dám thực hiện gấp đôi số mục tiêu quan trọng (${baseHard * 2}) không?`,
        icon: "🏆"
      };
      case 3: return {
        title: "Bứt Phá Giới Hạn!",
        desc: `Thách thức tối thượng: Gấp đôi tất cả nhiệm vụ (${baseNormal * 2} Thường & ${baseHard * 2} Khó).`,
        icon: "🔥"
      };
      default: return { title: "", desc: "", icon: "" };
    }
  };

  const { title, desc, icon } = getChallengeText();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-surface-container-lowest w-full max-w-[340px] rounded-[3rem] overflow-hidden relative shadow-2xl border border-white/20"
        >
          {/* Decorative background */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent -z-10"></div>
          
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner border border-primary/5 animate-bounce-slow">
              {icon}
            </div>
            
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Thách thức hôm nay</h2>
            <h3 className="text-2xl font-headline font-black text-on-surface tracking-tight mb-4 leading-tight">{title}</h3>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-8 px-2">
              {desc}
              <br/>
              <span className="inline-block mt-4 text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full">NHẬN NGAY +50 XP 💎</span>
            </p>

            <div className="space-y-3 w-full">
              <button 
                onClick={onAccept}
                className="w-full bg-primary text-on-primary font-headline font-black py-4 rounded-[20px] transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
              >
                <span>CHẤP NHẬN</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">bolt</span>
              </button>
              
              <button 
                onClick={onDecline}
                className="w-full bg-surface-container-high text-on-surface-variant/60 font-headline font-bold py-3 rounded-2xl hover:bg-surface-container-highest transition-colors active:scale-95 text-xs tracking-widest"
              >
                CỨ ĐỂ SAU ĐÃ
              </button>
            </div>
          </div>
          
          {/* Floating particle deco */}
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/10 blur-xl rounded-full"></div>
          <div className="absolute top-1/2 -left-4 w-16 h-16 bg-secondary/10 blur-xl rounded-full"></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
