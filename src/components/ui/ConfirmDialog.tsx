"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Подтвердить",
  cancelLabel  = "Отмена",
  danger       = false,
  confirmLoading = false,
  confirmDisabled = false,
  cancelDisabled = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={cancelDisabled ? undefined : onCancel}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <p className="font-black text-text text-lg mb-2">{title}</p>
              <p className="text-text-muted text-sm leading-relaxed mb-6">{description}</p>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={onCancel} disabled={cancelDisabled}>
                  {cancelLabel}
                </Button>
                <Button
                  variant={danger ? "accent" : "primary"}
                  fullWidth
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  loading={confirmLoading}
                  className={danger ? "bg-red-500 hover:bg-red-600 border-red-500" : ""}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
