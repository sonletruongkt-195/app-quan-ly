'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReminderBannerProps {
  isVisible: boolean;
  onClose: () => void;
  message: string;
}

export default function ReminderBanner({ isVisible, onClose, message }: ReminderBannerProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000); // Auto-close after 10s
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.y < -20) {
              onClose(); // Swipe up to close
            }
          }}
          className="fixed top-24 left-0 w-full px-4 z-[100] pointer-events-none"
        >
          <div className="max-w-md mx-auto bg-orange-600/95 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto border border-white/20 backdrop-blur-xl">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
              <span className="material-symbols-outlined text-white font-black">alarm</span>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-0.5">Lời nhắc kỷ luật</p>
              <p className="text-sm font-bold leading-tight">{message}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
          <div className="flex justify-center mt-2">
             <div className="w-8 h-1 bg-white/30 rounded-full"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
