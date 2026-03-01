import * as THREE from "three";

export interface ModelData {
  object: THREE.Object3D;
  name: string;
  format: string;
  stats: {
    vertices: number;
    triangles: number;
  };
  side: THREE.Side;
  color: string;
  /** When false, model is hidden in the viewer. Default true. */
  visible?: boolean;
}
