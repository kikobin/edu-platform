"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUserStore } from "@/store/userStore";

export const XPPopup = memo(function XPPopup() {
  const xpPopup = useUserStore((s) => s.xpPopup);

  return (
    <AnimatePresence>
      {xpPopup.visible && (
        <motion.div
          key="xp-popup"
          initial={{ scale: 0.4, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 500, damping: 24 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none select-none"
        >
          <div className="relative">
            {/* Свечение */}
            <div className="absolute inset-0 bg-accent rounded-3xl blur-xl opacity-60 scale-110" />
            {/* Карточка */}
            <div className="relative bg-[#1A1A2E] rounded-3xl px-8 py-5 flex items-center gap-4 shadow-2xl border border-white/10">
              <motion.span
                initial={{ rotate: -20 }}
                animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl"
              >
                ⚡
              </motion.span>
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Получено</p>
                <p className="text-accent text-3xl font-black leading-none">+{xpPopup.amount} XP</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
