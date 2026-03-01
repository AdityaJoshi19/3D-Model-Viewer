import React from "react";
import { motion } from "motion/react";
import { RotateCcw, Layers, Download } from "lucide-react";
import { cn } from "../../utils/cn";

interface ControlsProps {
  resetCamera: () => void;
  handleExport: (format: "stl" | "glb") => void;
  theme: "light" | "dark";
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  resetCamera,
  handleExport,
  theme,
  showGrid,
  setShowGrid,
}) => {
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className={cn(
        "absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-2xl md:rounded-3xl backdrop-blur-xl border shadow-xl z-20 transition-colors duration-500",
        isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-slate-200",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 px-1 md:px-2 border-r transition-colors",
          isDark ? "border-white/10" : "border-slate-200",
        )}
      >
        <button
          onClick={resetCamera}
          className={cn(
            "p-2.5 md:p-3 rounded-xl transition-colors group",
            isDark ? "hover:bg-white/10" : "hover:bg-slate-100",
          )}
          title="Reset View"
        >
          <RotateCcw
            className={cn(
              "w-5 h-5 transition-colors",
              isDark
                ? "text-white/40 group-hover:text-white"
                : "text-slate-400 group-hover:text-slate-600",
            )}
          />
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={cn(
            "p-2.5 md:p-3 rounded-xl transition-colors group",
            showGrid
              ? isDark
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-emerald-500/10 text-emerald-600"
              : isDark
                ? "hover:bg-white/10 text-white/40 hover:text-white"
                : "hover:bg-slate-100 text-slate-400 hover:text-slate-600",
          )}
          title="Toggle Grid"
        >
          <Layers className="w-5 h-5 transition-colors" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3 px-1 md:px-2">
        <div className="hidden sm:flex items-center gap-2 mr-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span
            className={cn(
              "text-[9px] font-mono uppercase tracking-widest transition-colors",
              isDark ? "text-white/30" : "text-slate-400",
            )}
          >
            Export
          </span>
        </div>
        <button
          onClick={() => handleExport("stl")}
          className={cn(
            "px-4 md:px-6 py-2 md:py-2.5 rounded-xl border transition-all text-xs md:text-sm font-semibold flex items-center gap-2 group",
            isDark
              ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200",
          )}
        >
          <Download
            className={cn(
              "w-4 h-4 transition-colors",
              isDark
                ? "text-white/40 group-hover:text-white"
                : "text-slate-400 group-hover:text-slate-600",
            )}
          />
          STL
        </button>
        <button
          onClick={() => handleExport("glb")}
          className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          GLB
        </button>
      </div>
    </motion.div>
  );
};
