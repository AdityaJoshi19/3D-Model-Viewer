import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, Eye, EyeOff, Trash2 } from "lucide-react";
import * as THREE from "three";
import { ModelData } from "../../types";
import { cn } from "../../utils/cn";

interface AssetPanelProps {
  models: ModelData[];
  isAssetTabOpen: boolean;
  handleExport: (format: "stl" | "glb", index: number) => void;
  removeModel: (index: number) => void;
  toggleSide: (index: number) => void;
  toggleModelVisibility: (index: number) => void;
  updateModelColor: (index: number, color: string) => void;
  getRootProps: any;
  getInputProps: any;
  theme: "light" | "dark";
}

export const AssetPanel: React.FC<AssetPanelProps> = ({
  models,
  isAssetTabOpen,
  handleExport,
  removeModel,
  toggleSide,
  toggleModelVisibility,
  updateModelColor,
  getRootProps,
  getInputProps,
  theme,
}) => {
  const isDark = theme === "dark";
  const colors = [
    "#ffffff",
    "#ff4444",
    "#44ff44",
    "#4444ff",
    "#ffff44",
    "#ff44ff",
    "#44ffff",
    "#ffa500",
    "#808080",
    "#404040",
    "#000000",
  ];

  return (
    <AnimatePresence>
      {isAssetTabOpen && (
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          className={cn(
            "absolute top-4 md:top-10 right-4 md:right-10 w-[calc(100%-2rem)] sm:w-80 max-h-[70vh] overflow-y-auto p-4 md:p-6 rounded-2xl md:rounded-[32px] backdrop-blur-xl border shadow-2xl space-y-4 md:space-y-6 scrollbar-hide z-20 transition-colors duration-500",
            isDark
              ? "bg-black/60 border-white/10"
              : "bg-white/80 border-slate-200",
          )}
        >
          <div className="flex items-center justify-between">
            <h3
              className={cn(
                "text-xs font-bold uppercase tracking-[0.2em]",
                isDark ? "text-white/30" : "text-slate-400",
              )}
            >
              Loaded Assets
            </h3>
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center",
                isDark ? "bg-white/5" : "bg-slate-100",
              )}
            >
              <Info
                className={cn(
                  "w-4 h-4",
                  isDark ? "text-white/40" : "text-slate-400",
                )}
              />
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {models.map((m, idx) => (
              <div
                key={`${m.name}-${idx}`}
                className={cn(
                  "p-3 md:p-4 rounded-xl md:rounded-2xl border space-y-3 group/item transition-colors",
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-slate-50 border-slate-200",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-bold truncate max-w-[120px]",
                      isDark ? "text-white/80" : "text-slate-700",
                    )}
                  >
                    {m.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleModelVisibility(idx)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100",
                        isDark
                          ? "text-white/50 hover:bg-white/10 hover:text-white"
                          : "text-slate-400 hover:bg-slate-200 hover:text-slate-600",
                      )}
                      title={m.visible !== false ? "Hide model" : "Show model"}
                    >
                      {m.visible !== false ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleExport("stl", idx)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors text-[10px] font-mono",
                        isDark
                          ? "hover:bg-white/10 text-white/40 hover:text-white"
                          : "hover:bg-slate-200 text-slate-400 hover:text-slate-600",
                      )}
                      title="Export STL"
                    >
                      STL
                    </button>
                    <button
                      onClick={() => removeModel(idx)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100",
                        "hover:bg-red-500 hover:text-white",
                        isDark ? "text-white/50" : "text-slate-400",
                      )}
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Color Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-[8px] uppercase tracking-widest font-bold",
                        isDark ? "text-white/20" : "text-slate-400",
                      )}
                    >
                      Mesh Color
                    </p>
                    <div className="relative">
                      <input
                        type="color"
                        value={m.color}
                        onChange={(e) => updateModelColor(idx, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div
                        className="w-4 h-4 rounded-md border border-white/20 shadow-sm"
                        style={{ backgroundColor: m.color }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateModelColor(idx, color)}
                        className={cn(
                          "w-4 h-4 rounded-full border transition-transform hover:scale-125",
                          m.color.toLowerCase() === color.toLowerCase()
                            ? "border-emerald-500 scale-110"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <p
                      className={cn(
                        "text-[8px] uppercase tracking-widest font-bold",
                        isDark ? "text-white/20" : "text-slate-400",
                      )}
                    >
                      Format
                    </p>
                    <p className="text-[10px] font-mono text-emerald-500 uppercase">
                      {m.format}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p
                      className={cn(
                        "text-[8px] uppercase tracking-widest font-bold",
                        isDark ? "text-white/20" : "text-slate-400",
                      )}
                    >
                      Tris
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-mono",
                        isDark ? "text-white/60" : "text-slate-600",
                      )}
                    >
                      {m.stats.triangles.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "pt-2 flex items-center justify-between border-t",
                    isDark ? "border-white/5" : "border-slate-200",
                  )}
                >
                  <p
                    className={cn(
                      "text-[8px] uppercase tracking-widest font-bold",
                      isDark ? "text-white/20" : "text-slate-400",
                    )}
                  >
                    Backface
                  </p>
                  <div
                    className={cn(
                      "flex p-0.5 rounded-lg",
                      isDark ? "bg-white/5" : "bg-slate-200",
                    )}
                  >
                    <button
                      onClick={() =>
                        m.side !== THREE.FrontSide && toggleSide(idx)
                      }
                      className={cn(
                        "px-2 py-1 rounded-md text-[8px] font-bold transition-all",
                        m.side === THREE.FrontSide
                          ? isDark
                            ? "bg-white/10 text-white"
                            : "bg-white text-slate-900 shadow-sm"
                          : isDark
                            ? "text-white/30 hover:text-white"
                            : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      SINGLE
                    </button>
                    <button
                      onClick={() =>
                        m.side !== THREE.DoubleSide && toggleSide(idx)
                      }
                      className={cn(
                        "px-2 py-1 rounded-md text-[8px] font-bold transition-all",
                        m.side === THREE.DoubleSide
                          ? isDark
                            ? "bg-white/10 text-white"
                            : "bg-white text-slate-900 shadow-sm"
                          : isDark
                            ? "text-white/30 hover:text-white"
                            : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      DOUBLE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <div
              {...getRootProps()}
              className={cn(
                "p-4 rounded-xl md:rounded-2xl border border-dashed transition-all cursor-pointer text-center group",
                isDark
                  ? "border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                  : "border-slate-300 hover:border-emerald-500 hover:bg-emerald-50",
              )}
            >
              <input {...getInputProps()} />
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest transition-colors",
                  isDark
                    ? "text-white/20 group-hover:text-emerald-400"
                    : "text-slate-400 group-hover:text-emerald-600",
                )}
              >
                + Add More Assets
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
