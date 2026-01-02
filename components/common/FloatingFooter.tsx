"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckSquare } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type ViewType = "event" | "checklist";

export default function FloatingFooter() {
  const router = useRouter();
  const pathname = usePathname();

  // Determine current view based on path
  const currentView: ViewType = pathname?.includes("/checklist")
    ? "checklist"
    : "event";

  const handleNavigate = (view: ViewType) => {
    if (view === "checklist") {
      router.push("/checklist");
    } else {
      router.push("/main/event");
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center gap-1 bg-white rounded-full border border-gray-200 shadow-lg p-1.5"
      >
        {/* Event Button */}
        <button
          onClick={() => handleNavigate("event")}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
            currentView === "event"
              ? "text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <AnimatePresence>
            {currentView === "event" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-bgPrimary rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </AnimatePresence>
          <Calendar className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Event</span>
        </button>

        {/* Checklist Button */}
        <button
          onClick={() => handleNavigate("checklist")}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
            currentView === "checklist"
              ? "text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <AnimatePresence>
            {currentView === "checklist" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-bgPrimary rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </AnimatePresence>
          <CheckSquare className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Checklist</span>
        </button>
      </motion.div>
    </div>
  );
}
