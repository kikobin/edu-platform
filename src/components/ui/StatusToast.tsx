"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUserStore } from "@/store/userStore";

export const StatusToast = memo(function StatusToast() {
  const toast = useUserStore((s) => s.toast);

  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed left-4 right-4 bottom-20 md:left-auto md:right-6 md:bottom-6 md:w-[360px] z-[90]"
        >
          <div className="rounded-2xl border border-primary/15 bg-white shadow-card-md px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-primary-light text-primary flex items-center justify-center font-black">
                ✓
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-text">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
