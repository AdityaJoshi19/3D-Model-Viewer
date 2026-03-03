import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  PerspectiveCamera,
  OrbitControls,
  Center,
  Grid,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { ModelData } from "../../types";
import { Headlight } from "./Headlight";

// Theme accent (emerald) for selection highlight
const SELECTED_HIGHLIGHT_LIGHT = 0x10b981; // emerald-500
const SELECTED_HIGHLIGHT_DARK = 0x34d399;  // emerald-400
const SELECTED_EMISSIVE_INTENSITY = 0.45;
const SELECTED_OPACITY = 0.88;

function getModelIndexFromHit(object: THREE.Object3D): number | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.modelIndex !== undefined) return current.userData.modelIndex as number;
    current = current.parent;
  }
  return null;
}

interface SceneProps {
  models: ModelData[];
  controlsRef: React.RefObject<any>;
  theme: "light" | "dark";
  showGrid: boolean;
  backfacePreview?: { index: number; side: THREE.Side } | null;
  selectedModelIndex: number | null;
  setSelectedModelIndex: (index: number | null) => void;
  inspectionMode: boolean;
  setHoveredInspection: (data: { index: number; clientX: number; clientY: number } | null) => void;
}

export const Scene: React.FC<SceneProps> = ({
  models,
  controlsRef,
  theme,
  showGrid,
  backfacePreview = null,
  selectedModelIndex,
  setSelectedModelIndex,
  inspectionMode,
  setHoveredInspection,
}) => {
  const { scene, set, raycaster, pointer, camera, gl } = useThree();
  const modelRootsRef = useRef<THREE.Object3D[]>([]);
  modelRootsRef.current = models
    .filter((m) => m.visible !== false)
    .map((m) => m.object);

  useEffect(() => {
    set({ onPointerMissed: () => setSelectedModelIndex(null) });
    return () => set({ onPointerMissed: undefined });
  }, [set, setSelectedModelIndex]);

  useEffect(() => {
    if (!inspectionMode) setHoveredInspection(null);
  }, [inspectionMode, setHoveredInspection]);

  useEffect(() => {
    models.forEach((m, index) => {
      m.object.traverse((child) => {
        child.userData.modelIndex = index;
      });
    });
  }, [models]);

  const lastHoverRef = useRef<{ index: number; x: number; y: number } | null>(null);
  useFrame(() => {
    if (!inspectionMode || modelRootsRef.current.length === 0) {
      if (lastHoverRef.current !== null) {
        lastHoverRef.current = null;
        setHoveredInspection(null);
      }
      return;
    }
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(modelRootsRef.current, true);
    const first = intersects[0];
    if (!first) {
      if (lastHoverRef.current !== null) {
        lastHoverRef.current = null;
        setHoveredInspection(null);
      }
      return;
    }
    const modelIndex = getModelIndexFromHit(first.object);
    if (modelIndex == null) {
      if (lastHoverRef.current !== null) {
        lastHoverRef.current = null;
        setHoveredInspection(null);
      }
      return;
    }
    const rect = gl.domElement.getBoundingClientRect();
    const clientX = rect.left + (pointer.x * 0.5 + 0.5) * rect.width;
    const clientY = rect.top + (-pointer.y * 0.5 + 0.5) * rect.height;
    const x = Math.round(clientX);
    const y = Math.round(clientY);
    const last = lastHoverRef.current;
    if (last && last.index === modelIndex && last.x === x && last.y === y) return;
    lastHoverRef.current = { index: modelIndex, x, y };
    setHoveredInspection({ index: modelIndex, clientX, clientY });
  });

  useEffect(() => {
    const isDark = theme === "dark";
    // More distinct gray background for dark theme
    const bgColor = isDark ? "#333333" : "#f0f0f0";

    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(bgColor, 50, 500);

    models.forEach((m, index) => {
      m.object.visible = m.visible !== false;
      const effectiveSide =
        backfacePreview?.index === index ? backfacePreview.side : m.side;
      const isSelected = selectedModelIndex === index;
      m.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.side = effectiveSide;
            child.material.color.set(m.color);
            child.material.needsUpdate = true;
            child.material.roughness = 0.8;
            child.material.metalness = 0.0;
            child.material.envMapIntensity = isDark ? 0.4 : 0.5;
            if (isSelected) {
              child.material.emissive.setHex(
                isDark ? SELECTED_HIGHLIGHT_DARK : SELECTED_HIGHLIGHT_LIGHT,
              );
              child.material.emissiveIntensity = SELECTED_EMISSIVE_INTENSITY;
              child.material.transparent = true;
              child.material.opacity = SELECTED_OPACITY;
            } else {
              child.material.emissive.setHex(0x000000);
              child.material.emissiveIntensity = 0;
              child.material.transparent = false;
              child.material.opacity = 1;
            }
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
  }, [models, scene, theme, backfacePreview, selectedModelIndex]);

  const isDark = theme === "dark";

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[8, 8, 8]}
        fov={35}
        near={0.1}
        far={10000}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={true}
        dampingFactor={0.05}
      />

      <Center top>
        {models.map((model, idx) => (
          <group
            key={`${model.name}-${idx}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedModelIndex(idx);
            }}
          >
            <primitive object={model.object} />
          </group>
        ))}
      </Center>

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={isDark ? 0.8 : 0.4}
        scale={20}
        blur={2}
        far={4}
        color={isDark ? "#000000" : "#000000"}
      />

      {showGrid && (
        <Grid
          infiniteGrid
          fadeDistance={200}
          fadeStrength={2}
          sectionSize={1}
          sectionThickness={1}
          sectionColor={isDark ? "#333333" : "#d1d1d1"}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor={isDark ? "#222222" : "#e5e5e5"}
          position={[0, -0.02, 0]}
          side={THREE.DoubleSide}
        />
      )}

      <ambientLight intensity={isDark ? 0.3 : 0.7} />
      <Headlight />

      <spotLight
        position={[10, 15, 10]}
        angle={0.3}
        penumbra={1}
        intensity={isDark ? 1.0 : 1.5}
        castShadow
      />

      <directionalLight
        position={[-10, 10, 5]}
        intensity={isDark ? 0.2 : 0.5}
      />

      <Environment preset={isDark ? "night" : "apartment"} />
    </>
  );
};
