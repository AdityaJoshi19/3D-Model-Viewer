import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScanSearch, Eye, EyeOff, Trash2 } from "lucide-react";
import * as THREE from "three";
import { ModelData } from "../../types";
import { cn } from "../../utils/cn";

interface AssetPanelProps {
  models: ModelData[];
  isAssetTabOpen: boolean;
  selectedModelIndex: number | null;
  setSelectedModelIndex: (index: number | null) => void;
  inspectionMode: boolean;
  setInspectionMode: (on: boolean) => void;
  handleExport: (format: "stl" | "glb", index: number) => void;
  removeModel: (index: number) => void;
  toggleSide: (index: number) => void;
  toggleModelVisibility: (index: number) => void;
  updateModelColor: (index: number, color: string) => void;
  setBackfacePreview: (preview: { index: number; side: THREE.Side } | null) => void;
  getRootProps: any;
  getInputProps: any;
  theme: "light" | "dark";
}

export const AssetPanel: React.FC<AssetPanelProps> = ({
  models,
  isAssetTabOpen,
  selectedModelIndex,
  setSelectedModelIndex,
  inspectionMode,
  setInspectionMode,
  handleExport,
  removeModel,
  toggleSide,
  toggleModelVisibility,
  updateModelColor,
  setBackfacePreview,
  getRootProps,
  getInputProps,
  theme,
}) => {
  const isDark = theme === "dark";
  const [colorOpenIndex, setColorOpenIndex] = useState<number | null>(null);
  const colorTriggerRef = useRef<HTMLButtonElement | null>(null);
  const colorPopoverRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (colorOpenIndex === null) return;
      const target = e.target as Node;
      const inPopover = colorPopoverRef.current?.contains(target);
      const inTrigger = colorTriggerRef.current?.contains(target);
      if (!inPopover && !inTrigger) setColorOpenIndex(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [colorOpenIndex]);

  return (
    <AnimatePresence>
      {isAssetTabOpen && (
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          className={cn(
            "absolute top-4 md:top-10 right-4 md:right-10 w-[calc(100%-2rem)] sm:w-[420px] max-h-[70vh] flex flex-col rounded-2xl backdrop-blur-xl border shadow-xl z-20 transition-colors duration-500 px-4",
            colorOpenIndex !== null ? "overflow-visible" : "overflow-hidden",
            isDark
              ? "bg-black/70 border-white/10"
              : "bg-white/90 border-slate-200",
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center justify-between py-1.5 border-b shrink-0",
              isDark ? "border-white/10" : "border-slate-200",
            )}
          >
            <h3
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isDark ? "text-white/40" : "text-slate-500",
              )}
            >
              Loaded Assets
            </h3>
            <button
              type="button"
              onClick={() => setInspectionMode(!inspectionMode)}
              title={inspectionMode ? "Inspection mode ON – hover models for metadata" : "Inspection mode OFF – click to enable"}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                inspectionMode
                  ? isDark
                    ? "bg-emerald-500/25 text-emerald-400"
                    : "bg-emerald-500/20 text-emerald-600"
                  : isDark
                    ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600",
              )}
            >
              <ScanSearch className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table - overflow-visible when color popover open so it isn't clipped */}
          <div
            className={cn(
              "flex-1 min-h-0 -mx-4 px-4",
              colorOpenIndex !== null ? "overflow-visible" : "overflow-x-auto overflow-y-auto",
            )}
          >
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0 z-10">
                <tr
                  className={cn(
                    isDark ? "bg-black/50 text-white/40" : "bg-slate-100/90 text-slate-500",
                  )}
                >
                  <th className="w-6 py-1 pl-0 pr-1 text-left font-semibold">#</th>
                  <th className="w-8 py-1 px-0 text-center font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        const allVisible = models.every((m) => m.visible !== false);
                        if (allVisible) {
                          models.forEach((_, i) => toggleModelVisibility(i));
                        } else {
                          models.forEach((m, i) => {
                            if (m.visible === false) toggleModelVisibility(i);
                          });
                        }
                      }}
                      title={
                        models.length > 0 && models.every((m) => m.visible === false)
                          ? "Show all"
                          : "Hide all"
                      }
                      className={cn(
                        "p-0.5 rounded transition-colors inline-flex",
                        models.length > 0 && models.every((m) => m.visible === false)
                          ? isDark
                            ? "text-white/40 hover:bg-white/10 hover:text-white/60"
                            : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                          : isDark
                            ? "text-emerald-400 hover:bg-white/10 hover:text-emerald-300"
                            : "text-emerald-600 hover:bg-white/80 hover:text-emerald-700",
                      )}
                    >
                      {models.length > 0 && models.every((m) => m.visible === false) ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </th>
                  <th className="py-1 px-1.5 text-left font-semibold min-w-[120px]">Name</th>
                  <th className="w-10 py-1 px-0.5 text-center font-semibold">Fmt</th>
                  <th className="w-8 py-1 px-0 text-center font-semibold" title="Color">Clr</th>
                  <th className="w-12 py-1 px-0.5 text-right font-semibold">Tris</th>
                  <th className="w-16 py-1 px-0.5 text-center font-semibold">Back</th>
                  <th className="w-14 py-1 pr-0 pl-0.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, idx) => (
                  <tr
                    key={`${m.name}-${idx}`}
                    className={cn(
                      "group/row border-b transition-colors",
                      selectedModelIndex === idx
                        ? isDark
                          ? "bg-emerald-500/20 border-emerald-500/30"
                          : "bg-emerald-500/15 border-emerald-500/40"
                        : isDark
                          ? "border-white/5 hover:bg-white/5"
                          : "border-slate-100 hover:bg-slate-50",
                    )}
                  >
                    <td className="py-0.5 px-1 font-mono text-[10px] opacity-70">
                      {idx + 1}
                    </td>
                    <td className="py-0.5 px-0 text-center">
                      <button
                        onClick={() => toggleModelVisibility(idx)}
                        className={cn(
                          "p-0.5 rounded transition-colors",
                          m.visible !== false
                            ? isDark
                              ? "text-emerald-400 hover:text-emerald-300"
                              : "text-emerald-600 hover:text-emerald-700"
                            : isDark
                              ? "text-white/30 hover:text-white/50"
                              : "text-slate-400 hover:text-slate-600",
                        )}
                        title={m.visible !== false ? "Hide" : "Show"}
                      >
                        {m.visible !== false ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                    <td className="py-0.5 px-1.5 min-w-[120px] max-w-[180px]">
                      <button
                        type="button"
                        onClick={() => setSelectedModelIndex(idx)}
                        className={cn(
                          "block w-full text-left font-medium text-[11px] truncate cursor-pointer rounded px-0.5 -mx-0.5 py-0.5 -my-0.5 transition-colors",
                          isDark
                            ? "text-white/90 hover:bg-white/10"
                            : "text-slate-800 hover:bg-slate-200/80",
                        )}
                        title={m.name}
                      >
                        {m.name}
                      </button>
                    </td>
                    <td className="py-0.5 px-0.5 text-center">
                      <span
                        className={cn(
                          "text-[9px] font-mono uppercase",
                          isDark ? "text-emerald-400/90" : "text-emerald-600",
                        )}
                      >
                        {m.format}
                      </span>
                    </td>
                    <td className="py-0.5 px-0 text-center align-middle relative">
                      <div className="relative inline-block">
                        <button
                          ref={(el) => {
                            if (idx === colorOpenIndex) colorTriggerRef.current = el;
                          }}
                          onClick={() =>
                            setColorOpenIndex((prev) => (prev === idx ? null : idx))
                          }
                          className="w-4 h-4 rounded border border-white/20 shadow-sm inline-block align-middle"
                          style={{ backgroundColor: m.color }}
                          title="Mesh color"
                        />
                        {/* Color panel inline above the swatch so it's always visible */}
                        {colorOpenIndex === idx && (
                          <div
                            ref={colorPopoverRef}
                            className={cn(
                              "absolute left-full top-0 ml-1 p-1.5 rounded-lg border shadow-xl flex flex-col gap-1 z-[100] min-w-[140px]",
                              isDark
                                ? "bg-slate-900 border-white/10"
                                : "bg-white border-slate-200",
                            )}
                          >
                            <div className="flex gap-0.5 flex-wrap max-w-[140px]">
                              {colors.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => {
                                    updateModelColor(idx, color);
                                  }}
                                  className={cn(
                                    "w-4 h-4 rounded-full border shrink-0",
                                    m.color.toLowerCase() === color.toLowerCase()
                                      ? "border-emerald-500 ring-1 ring-emerald-500"
                                      : "border-transparent",
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="color"
                                value={m.color}
                                onChange={(e) =>
                                  updateModelColor(idx, e.target.value)
                                }
                                className="w-6 h-4 rounded border-0 cursor-pointer p-0 bg-transparent"
                              />
                              <span className="text-[9px] opacity-70">Custom</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-0.5 px-0.5 text-right font-mono text-[10px] opacity-80">
                      {m.stats.triangles.toLocaleString()}
                    </td>
                    <td className="py-0.5 px-0.5 text-center">
                      <div
                        className={cn(
                          "inline-flex p-0.5 rounded text-[8px] font-medium",
                          isDark ? "bg-white/5" : "bg-slate-200/80",
                        )}
                      >
                        <button
                          onClick={() =>
                            m.side !== THREE.FrontSide && toggleSide(idx)
                          }
                          onMouseEnter={() =>
                            setBackfacePreview({ index: idx, side: THREE.FrontSide })
                          }
                          onMouseLeave={() => setBackfacePreview(null)}
                          title="Single side"
                          className={cn(
                            "px-1 rounded transition-colors",
                            m.side === THREE.FrontSide
                              ? isDark
                                ? "bg-white/15 text-white"
                                : "bg-white text-slate-800 shadow-sm"
                              : isDark
                                ? "text-white/40 hover:text-white"
                                : "text-slate-500 hover:text-slate-700",
                          )}
                        >
                          S
                        </button>
                        <button
                          onClick={() =>
                            m.side !== THREE.DoubleSide && toggleSide(idx)
                          }
                          onMouseEnter={() =>
                            setBackfacePreview({ index: idx, side: THREE.DoubleSide })
                          }
                          onMouseLeave={() => setBackfacePreview(null)}
                          title="Double side"
                          className={cn(
                            "px-1 rounded transition-colors",
                            m.side === THREE.DoubleSide
                              ? isDark
                                ? "bg-white/15 text-white"
                                : "bg-white text-slate-800 shadow-sm"
                              : isDark
                                ? "text-white/40 hover:text-white"
                                : "text-slate-500 hover:text-slate-700",
                          )}
                        >
                          D
                        </button>
                      </div>
                    </td>
                    <td className="py-0.5 px-0 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => handleExport("stl", idx)}
                          className={cn(
                            "px-1 py-0.5 rounded text-[9px] font-mono transition-colors",
                            isDark
                              ? "hover:bg-white/10 text-white/50 hover:text-white"
                              : "hover:bg-slate-200 text-slate-500 hover:text-slate-700",
                          )}
                          title="Export STL"
                        >
                          STL
                        </button>
                        <button
                          onClick={() => removeModel(idx)}
                          className={cn(
                            "p-0.5 rounded transition-colors hover:bg-red-500 hover:text-white",
                            isDark ? "text-white/40" : "text-slate-400",
                          )}
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add more */}
          <div
            className={cn(
              "shrink-0 py-1.5 border-t -mx-4 px-4",
              isDark ? "border-white/10" : "border-slate-200",
            )}
          >
            <div
              {...getRootProps()}
              className={cn(
                "py-1.5 px-2 rounded border border-dashed text-center cursor-pointer transition-all text-[10px] font-medium uppercase tracking-wider",
                isDark
                  ? "border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-white/30 hover:text-emerald-400"
                  : "border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600",
              )}
            >
              <input {...getInputProps()} />
              + Add more
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
