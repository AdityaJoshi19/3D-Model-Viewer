import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
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

interface SceneProps {
  models: ModelData[];
  controlsRef: React.RefObject<any>;
  theme: "light" | "dark";
  showGrid: boolean;
}

export const Scene: React.FC<SceneProps> = ({
  models,
  controlsRef,
  theme,
  showGrid,
}) => {
  const { scene } = useThree();

  useEffect(() => {
    const isDark = theme === "dark";
    // More distinct gray background for dark theme
    const bgColor = isDark ? "#333333" : "#f0f0f0";

    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(bgColor, 50, 500);

    models.forEach((m) => {
      m.object.visible = m.visible !== false;
      m.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.side = m.side;
            child.material.color.set(m.color);
            child.material.needsUpdate = true;
            child.material.roughness = 0.8;
            child.material.metalness = 0.0;
            child.material.envMapIntensity = isDark ? 0.4 : 0.5;
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
  }, [models, scene, theme]);

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
          <primitive key={`${model.name}-${idx}`} object={model.object} />
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
