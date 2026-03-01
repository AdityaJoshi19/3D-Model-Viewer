import React from "react";
import { motion } from "motion/react";
import { Upload } from "lucide-react";
import { cn } from "../../utils/cn";

interface UploaderProps {
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  error: string | null;
  theme: "light" | "dark";
}

export const Uploader: React.FC<UploaderProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  error,
  theme,
}) => {
  const isDark = theme === "dark";

  return (
    <motion.div
      key="uploader"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="absolute inset-0 flex items-center justify-center p-6 md:p-12"
    >
      <div
        {...getRootProps()}
        className={cn(
          "w-full max-w-3xl aspect-[16/9] rounded-3xl md:rounded-[40px] border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center gap-6 md:gap-8 cursor-pointer group relative overflow-hidden backdrop-blur-sm",
          isDark
            ? isDragActive
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] shadow-2xl"
            : isDragActive
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm",
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            "absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-500",
            isDark ? "opacity-20" : "opacity-10",
          )}
        >
          <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/20 blur-[100px] rounded-full" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500/20 blur-[100px] rounded-full" />
        </div>

        <div
          className={cn(
            "w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 border",
            isDark
              ? "bg-white/5 border-white/10"
              : "bg-slate-100 border-slate-200",
          )}
        >
          <Upload
            className={cn(
              "w-8 h-8 md:w-10 md:h-10 transition-colors duration-500",
              isDragActive
                ? "text-emerald-500"
                : isDark
                  ? "text-white/20"
                  : "text-slate-300",
            )}
          />
        </div>

        <div className="text-center space-y-2 md:space-y-3 z-10 px-6">
          <h2
            className={cn(
              "text-2xl md:text-3xl font-bold tracking-tight transition-colors",
              isDark ? "text-white" : "text-slate-800",
            )}
          >
            Import 3D Assets
          </h2>
          <p
            className={cn(
              "text-sm md:text-base max-w-sm mx-auto leading-relaxed transition-colors",
              isDark ? "text-white/40" : "text-slate-400",
            )}
          >
            Drag and drop multiple models to begin high-fidelity rendering and
            format conversion.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 md:gap-3 z-10 px-6">
          {["STL", "GLB", "GLTF", "OBJ", "PLY", "FBX", "DAE", "3DS", "NII"].map(
            (fmt) => (
              <span
                key={fmt}
                className={cn(
                  "px-2 md:px-3 py-1 rounded-full border text-[9px] md:text-[10px] font-mono tracking-widest transition-colors",
                  isDark
                    ? "bg-white/5 border-white/10 text-white/30"
                    : "bg-slate-100 border-slate-200 text-slate-400",
                )}
              >
                {fmt}
              </span>
            ),
          )}
        </div>

        {error && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "mt-4 md:mt-6 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border text-xs md:text-sm font-medium transition-colors",
              isDark
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-red-50 border-red-100 text-red-500",
            )}
          >
            {error}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
