"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect } from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  isLoading?: boolean;
}

const Modal = ({ children, onClose, isLoading = false }: ModalProps) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, isLoading]);

  return (
    <AnimatePresence>
      {/* ===== BACKDROP ===== */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-bgPrimaryDark/70
          backdrop-blur-sm
        "
      >
        {/* ===== MODAL ===== */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 22,
          }}
          onClick={(e) => e.stopPropagation()}
          className="
            relative w-full max-w-xl
            rounded-3xl
            border border-bgPrimary/40
            bg-white
            shadow-[0_25px_60px_rgba(0,0,0,0.35)]
          "
        >
          {/* ===== CLOSE BUTTON ===== */}
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
            className="
              absolute right-4 top-4
              flex h-9 w-9 items-center justify-center
              rounded-full
              border-bgPrimary/10
              text-bgPrimaryDark
              transition-all
              hover:bg-bgPrimary
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <X size={18} />
          </button>

          {/* ===== CONTENT ===== */}
          <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-8">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Modal;
