import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Box, Layers, Trash2, Sun, Moon } from "lucide-react";
import { cn } from "../../utils/cn";

interface HeaderProps {
  modelCount: number;
  isAssetTabOpen: boolean;
  setIsAssetTabOpen: (open: boolean) => void;
  resetModels: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  modelCount,
  isAssetTabOpen,
  setIsAssetTabOpen,
  resetModels,
  theme,
  toggleTheme,
}) => {
  const isDark = theme === "dark";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "flex items-center justify-between px-6 md:px-10 py-4 md:py-6 border-b backdrop-blur-md z-20 transition-colors duration-500",
        isDark ? "border-white/5 bg-black/40" : "border-black/5 bg-white/50",
      )}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group cursor-pointer">
          <Box className="text-white w-6 h-6 md:w-7 md:h-7 group-hover:rotate-12 transition-transform duration-500" />
        </div>
        <div>
          <h1
            className={cn(
              "text-xl md:text-2xl font-bold tracking-tight transition-colors",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            3D Model Viewer
          </h1>
          <p
            className={cn(
              "text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] transition-colors",
              isDark ? "text-white/30" : "text-slate-400",
            )}
          >
            Universal Model Engine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleTheme}
          className={cn(
            "p-2.5 md:p-3 rounded-xl transition-all border group",
            isDark
              ? "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
              : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-200",
          )}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <AnimatePresence mode="wait">
          {modelCount > 0 && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="flex items-center gap-2 md:gap-4"
            >
              <div
                className={cn(
                  "hidden sm:flex px-4 py-2 rounded-xl border items-center gap-2 group transition-colors",
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-slate-100 border-slate-200",
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isDark ? "text-white/60" : "text-slate-600",
                  )}
                >
                  {modelCount} {modelCount === 1 ? "Model" : "Models"}
                </span>
              </div>
              <button
                onClick={() => setIsAssetTabOpen(!isAssetTabOpen)}
                className={cn(
                  "p-2.5 md:p-3 rounded-xl transition-all border group",
                  isAssetTabOpen
                    ? isDark
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : isDark
                      ? "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600",
                )}
                title={
                  isAssetTabOpen ? "Close Asset Panel" : "Open Asset Panel"
                }
              >
                <Layers className="w-5 h-5" />
              </button>
              <button
                onClick={resetModels}
                className={cn(
                  "p-2.5 md:p-3 rounded-xl transition-all border group",
                  isDark
                    ? "hover:bg-red-500/20 text-white/40 hover:text-red-400 border-white/10 hover:border-red-500/30"
                    : "hover:bg-red-500/10 text-slate-400 hover:text-red-500 border-slate-200 hover:border-red-500/20",
                )}
                title="Remove All Models"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
