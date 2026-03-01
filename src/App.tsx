import React, { useState, useCallback, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFExporter, STLExporter } from "three-stdlib";
import { useDropzone } from "react-dropzone";
import { AnimatePresence } from "motion/react";

// Types & Utils
import { ModelData } from "./types";
import { cn } from "./utils/cn";

// Services
import { loadModel } from "./services/modelLoader";

// Components
import { Scene } from "./components/Viewer/Scene";
import { Header } from "./components/UI/Header";
import { Uploader } from "./components/UI/Uploader";
import { Controls } from "./components/UI/Controls";
import { AssetPanel } from "./components/UI/AssetPanel";
import { Loader } from "./components/UI/Loader";

export default function App() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAssetTabOpen, setIsAssetTabOpen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showGrid, setShowGrid] = useState(true);
  const controlsRef = useRef<any>(null);
  const hasInitialFitRef = useRef(false);
  const fitAnimationRafRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setLoading(true);
    setError(null);

    // Safety: force loading off after 90s so loader can't hang forever
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
      loadingTimeoutRef.current = null;
      setLoading(false);
    }, 90000);

    try {
      const newModels = await Promise.all(
        acceptedFiles.map((file) => loadModel(file)),
      );
      setModels((prev) => [...prev, ...newModels]);
    } catch (err) {
      console.error(err);
      setError(
        "One or more files failed to load. Please use STL, GLB, GLTF, OBJ, PLY, FBX, DAE, 3DS or NII.",
      );
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (fitAnimationRafRef.current !== null) {
        cancelAnimationFrame(fitAnimationRafRef.current);
        fitAnimationRafRef.current = null;
      }
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "model/stl": [".stl"],
      "model/gltf-binary": [".glb"],
      "model/gltf+json": [".gltf"],
      "text/plain": [".obj"],
      "application/octet-stream": [
        ".ply",
        ".fbx",
        ".dae",
        ".3ds",
        ".nii",
        ".nii.gz",
      ],
    },
  });

  const handleExport = (format: "stl" | "glb", modelIndex?: number) => {
    const modelsToExport =
      modelIndex !== undefined ? [models[modelIndex]] : models;
    if (modelsToExport.length === 0) return;

    modelsToExport.forEach((m) => {
      const exportObject = m.object;

      if (format === "stl") {
        const exporter = new STLExporter();
        const result = exporter.parse(exportObject, {
          binary: true,
        }) as DataView;
        const buffer = result.buffer.slice(
          result.byteOffset,
          result.byteOffset + result.byteLength,
        ) as ArrayBuffer;
        const blob = new Blob([buffer], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${m.name.split(".")[0]}.stl`;
        link.click();
      } else if (format === "glb") {
        const exporter = new GLTFExporter();
        exporter.parse(
          exportObject,
          (result) => {
            const blob = new Blob([result as ArrayBuffer], {
              type: "application/octet-stream",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${m.name.split(".")[0]}.glb`;
            link.click();
          },
          (error) => console.error("Export error", error),
          { binary: true },
        );
      }
    });
  };

  const removeModel = (index: number) => {
    setModels((prev) => prev.filter((_, i) => i !== index));
  };

  const resetModels = () => {
    setModels([]);
    setError(null);
  };

  const toggleSide = (index: number) => {
    setModels((prev) =>
      prev.map((m, i) => {
        if (i === index) {
          return {
            ...m,
            side:
              m.side === THREE.FrontSide ? THREE.DoubleSide : THREE.FrontSide,
          };
        }
        return m;
      }),
    );
  };

  const updateModelColor = (index: number, color: string) => {
    setModels((prev) =>
      prev.map((m, i) => {
        if (i === index) {
          return { ...m, color };
        }
        return m;
      }),
    );
  };

  const toggleModelVisibility = (index: number) => {
    setModels((prev) =>
      prev.map((m, i) => {
        if (i === index) {
          return { ...m, visible: m.visible !== false ? false : true };
        }
        return m;
      }),
    );
  };

  /** Fixed view direction (camera in positive octant). Y is up (grid plane is XZ). */
  const FIT_VIEW_DIRECTION = new THREE.Vector3(1, 1, 1).normalize();
  const FIT_CAMERA_UP = new THREE.Vector3(0, 1, 0);
  const FOV_DEG = 35;
  const FIT_PADDING = 1.4;
  const FIT_ANIMATION_DURATION_MS = 2000;

  const easeInOutCubic = (t: number) =>
    t <= 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const fitCameraToBox = useCallback(
    (options: { animate?: boolean } = {}) => {
      if (models.length === 0) return;

      const box = new THREE.Box3();
      models.forEach((m) => {
        if (m.visible !== false) box.expandByObject(m.object);
      });
      if (box.isEmpty()) return;

      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim <= 0) return;

      const aspect = window.innerWidth / window.innerHeight;
      let distance =
        maxDim / 2 / Math.tan(THREE.MathUtils.degToRad(FOV_DEG / 2));
      if (aspect < 1) distance = distance / aspect;
      distance *= FIT_PADDING;

      const targetPosition = center
        .clone()
        .addScaledVector(FIT_VIEW_DIRECTION, distance);
      const targetCenter = center.clone();

      const applyFit = () => {
        const controls = controlsRef.current;
        if (!controls) return false;
        const camera = controls.object as THREE.PerspectiveCamera;
        camera.up.copy(FIT_CAMERA_UP);
        controls.target.copy(targetCenter);
        camera.position.copy(targetPosition);
        camera.lookAt(targetCenter);
        controls.update();
        return true;
      };

      const controls = controlsRef.current;
      if (!controls) return;

      const camera = controls.object as THREE.PerspectiveCamera;

      if (options.animate) {
        if (fitAnimationRafRef.current !== null) {
          cancelAnimationFrame(fitAnimationRafRef.current);
          fitAnimationRafRef.current = null;
        }

        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();
        const startTime = performance.now();

        const tick = () => {
          const elapsed = performance.now() - startTime;
          const t = Math.min(elapsed / FIT_ANIMATION_DURATION_MS, 1);
          const eased = easeInOutCubic(t);

          if (!controlsRef.current) {
            fitAnimationRafRef.current = null;
            return;
          }
          const ctrl = controlsRef.current;
          const cam = ctrl.object as THREE.PerspectiveCamera;
          cam.position.lerpVectors(startPos, targetPosition, eased);
          ctrl.target.lerpVectors(startTarget, targetCenter, eased);
          cam.up.copy(FIT_CAMERA_UP);
          cam.lookAt(ctrl.target);
          ctrl.update();

          if (t < 1) {
            fitAnimationRafRef.current = requestAnimationFrame(tick);
          } else {
            fitAnimationRafRef.current = null;
          }
        };
        fitAnimationRafRef.current = requestAnimationFrame(tick);
      } else {
        applyFit();
      }
    },
    [models],
  );

  const resetCamera = useCallback(() => {
    if (controlsRef.current && models.length > 0) {
      fitCameraToBox({ animate: true });
    } else if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [models, fitCameraToBox]);

  // After upload, when loading is done: fit camera after delay so Canvas/controls are ready, with cinematic animation.
  useEffect(() => {
    if (models.length === 0) {
      hasInitialFitRef.current = false;
      return;
    }
    if (loading) return;
    if (hasInitialFitRef.current) return;
    hasInitialFitRef.current = true;

    const timeoutId = setTimeout(() => {
      if (controlsRef.current) {
        fitCameraToBox({ animate: true });
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [models.length, loading, fitCameraToBox]);

  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "flex flex-col h-screen font-sans overflow-hidden selection:bg-emerald-500/30 relative transition-colors duration-500",
        isDark ? "bg-[#333333] text-white" : "bg-[#f5f5f5] text-slate-900",
      )}
    >
      {/* Background Gradient */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-500",
          isDark
            ? "bg-[radial-gradient(circle_at_50%_50%,#444444_0%,#333333_100%)] opacity-100"
            : "bg-[radial-gradient(circle_at_50%_50%,#ffffff_0%,#f5f5f5_100%)] opacity-100",
        )}
      />

      <Header
        modelCount={models.length}
        isAssetTabOpen={isAssetTabOpen}
        setIsAssetTabOpen={setIsAssetTabOpen}
        resetModels={resetModels}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <Loader visible={loading} theme={theme} />

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {models.length === 0 ? (
            <Uploader
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              error={error}
              theme={theme}
            />
          ) : (
            <div className="w-full h-full relative group">
              <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ fov: 35, position: [8, 8, 8] }}
                gl={{
                  antialias: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  outputColorSpace: THREE.SRGBColorSpace,
                }}
              >
                <Scene
                  models={models}
                  controlsRef={controlsRef}
                  theme={theme}
                  showGrid={showGrid}
                />
              </Canvas>

              <Controls
                resetCamera={resetCamera}
                handleExport={handleExport}
                theme={theme}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
              />

              <AssetPanel
                models={models}
                isAssetTabOpen={isAssetTabOpen}
                handleExport={handleExport}
                removeModel={removeModel}
                toggleSide={toggleSide}
                toggleModelVisibility={toggleModelVisibility}
                updateModelColor={updateModelColor}
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                theme={theme}
              />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
