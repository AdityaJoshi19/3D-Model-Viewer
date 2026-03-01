import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Box } from "lucide-react";
import { cn } from "../../utils/cn";

interface LoaderProps {
  visible: boolean;
  theme: "light" | "dark";
}

export const Loader: React.FC<LoaderProps> = ({ visible, theme }) => {
  const isDark = theme === "dark";

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="loader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 backdrop-blur-md transition-colors duration-300",
              isDark ? "bg-black/50" : "bg-white/60",
            )}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-6 px-10 py-8 rounded-2xl md:rounded-3xl border shadow-2xl",
              isDark
                ? "bg-black/70 border-white/10 shadow-black/40"
                : "bg-white/90 border-slate-200/80 shadow-slate-300/30",
            )}
          >
            {/* Glow */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none overflow-hidden",
                isDark ? "opacity-30" : "opacity-20",
              )}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-500/30 blur-[60px] rounded-full" />
            </div>

            {/* Spinner: rotating ring + icon */}
            <div className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className={cn(
                  "absolute inset-0 rounded-full border-2 border-transparent",
                  "border-t-emerald-500 border-r-emerald-500/70",
                )}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className={cn(
                  "absolute inset-2 rounded-full border-2 border-transparent",
                  "border-b-emerald-400/50 border-l-emerald-400/30",
                )}
              />
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/20",
                  isDark ? "text-emerald-400" : "text-emerald-600",
                )}
              >
                <Box className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
              </motion.div>
            </div>

            <div className="relative text-center space-y-1">
              <p
                className={cn(
                  "text-sm md:text-base font-semibold tracking-tight",
                  isDark ? "text-white" : "text-slate-800",
                )}
              >
                Loading models
              </p>
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={cn(
                  "text-[10px] md:text-xs font-mono uppercase tracking-widest",
                  isDark ? "text-white/40" : "text-slate-500",
                )}
              >
                Parsing geometry…
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
