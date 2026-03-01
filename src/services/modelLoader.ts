import * as THREE from "three";
import {
  STLLoader,
  GLTFLoader,
  OBJLoader,
  PLYLoader,
  FBXLoader,
  ColladaLoader,
  TDSLoader,
} from "three-stdlib";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as nifti from "nifti-reader-js";
import { ModelData } from "../types";

export const loadModel = async (file: File): Promise<ModelData> => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const getStats = (obj: THREE.Object3D) => {
      let vertices = 0;
      let triangles = 0;
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const geometry = child.geometry;
          if (geometry.attributes.position) {
            vertices += geometry.attributes.position.count;
          }
          if (geometry.index) {
            triangles += geometry.index.count / 3;
          } else if (geometry.attributes.position) {
            triangles += geometry.attributes.position.count / 3;
          }
        }
      });
      return { vertices, triangles };
    };

    const finalize = (object: THREE.Object3D, name: string, format: string) => {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry instanceof THREE.BufferGeometry) {
            child.geometry = BufferGeometryUtils.mergeVertices(child.geometry);
            child.geometry.computeVertexNormals();
          }

          const isVoxel =
            child.material &&
            (child.material as THREE.MeshStandardMaterial).flatShading;

          child.material = new THREE.MeshStandardMaterial({
            color: isVoxel ? 0xffffff : 0xffffff,
            roughness: 0.8,
            metalness: 0.0,
            flatShading: !!isVoxel,
            envMapIntensity: 0.5,
          });
        }
      });

      resolve({
        object,
        name,
        format,
        stats: getStats(object),
        side: THREE.FrontSide,
        color: "#ffffff",
        visible: true,
      });
    };

    if (extension === "stl") {
      const loader = new STLLoader();
      loader.load(
        url,
        (geometry) => {
          const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.3,
            metalness: 0.8,
          });
          const mesh = new THREE.Mesh(geometry, material);
          finalize(mesh, file.name, "stl");
        },
        undefined,
        reject,
      );
    } else if (extension === "glb" || extension === "gltf") {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          finalize(gltf.scene, file.name, extension);
        },
        undefined,
        reject,
      );
    } else if (extension === "obj") {
      const loader = new OBJLoader();
      loader.load(
        url,
        (object) => {
          finalize(object, file.name, "obj");
        },
        undefined,
        reject,
      );
    } else if (extension === "ply") {
      const loader = new PLYLoader();
      loader.load(
        url,
        (geometry) => {
          const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.3,
            metalness: 0.8,
          });
          const mesh = new THREE.Mesh(geometry, material);
          finalize(mesh, file.name, "ply");
        },
        undefined,
        reject,
      );
    } else if (extension === "fbx") {
      const loader = new FBXLoader();
      loader.load(
        url,
        (object) => {
          finalize(object, file.name, "fbx");
        },
        undefined,
        reject,
      );
    } else if (extension === "dae") {
      const loader = new ColladaLoader();
      loader.load(
        url,
        (collada) => {
          finalize(collada.scene, file.name, "dae");
        },
        undefined,
        reject,
      );
    } else if (extension === "3ds") {
      const loader = new TDSLoader();
      loader.load(
        url,
        (object) => {
          finalize(object, file.name, "3ds");
        },
        undefined,
        reject,
      );
    } else if (extension === "nii" || extension === "gz") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer;
          let niftiHeader = null;
          let niftiImage = null;
          let rawData = null;

          if (nifti.isCompressed(data)) {
            const decompressed = nifti.decompress(data);
            niftiHeader = nifti.readHeader(decompressed);
            niftiImage = nifti.readImage(niftiHeader, decompressed);
            rawData = niftiImage;
          } else {
            niftiHeader = nifti.readHeader(data);
            niftiImage = nifti.readImage(niftiHeader, data);
            rawData = niftiImage;
          }

          const dims = niftiHeader.dims;
          let typedData;
          if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT8)
            typedData = new Uint8Array(rawData);
          else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT16)
            typedData = new Int16Array(rawData);
          else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT32)
            typedData = new Int32Array(rawData);
          else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_FLOAT32)
            typedData = new Float32Array(rawData);
          else typedData = new Float32Array(rawData);

          let min = Infinity,
            max = -Infinity,
            avg = 0;
          const sampleCount = Math.min(typedData.length, 10000);
          for (let i = 0; i < sampleCount; i++) {
            const val = typedData[Math.floor(Math.random() * typedData.length)];
            if (val < min) min = val;
            if (val > max) max = val;
            avg += val;
          }
          avg /= sampleCount;

          const threshold = avg + (max - avg) * 0.3;
          const nx = dims[1];
          const ny = dims[2];
          const nz = dims[3];

          const totalVoxels = nx * ny * nz;
          const sampleStep = Math.max(
            1,
            Math.floor(Math.pow(totalVoxels / 5000000, 1 / 3)),
          );

          const vertices: number[] = [];
          const indices: number[] = [];

          const getValue = (vx: number, vy: number, vz: number) => {
            if (vx < 0 || vx >= nx || vy < 0 || vy >= ny || vz < 0 || vz >= nz)
              return -Infinity;
            return typedData[vx + vy * nx + vz * nx * ny];
          };

          const grid: Map<string, number> = new Map();

          for (let z = 0; z < nz - sampleStep; z += sampleStep) {
            for (let y = 0; y < ny - sampleStep; y += sampleStep) {
              for (let x = 0; x < nx - sampleStep; x += sampleStep) {
                const v0 = getValue(x, y, z) > threshold;
                const v1 = getValue(x + sampleStep, y, z) > threshold;
                const v2 = getValue(x, y + sampleStep, z) > threshold;
                const v3 =
                  getValue(x + sampleStep, y + sampleStep, z) > threshold;
                const v4 = getValue(x, y, z + sampleStep) > threshold;
                const v5 =
                  getValue(x + sampleStep, y, z + sampleStep) > threshold;
                const v6 =
                  getValue(x, y + sampleStep, z + sampleStep) > threshold;
                const v7 =
                  getValue(x + sampleStep, y + sampleStep, z + sampleStep) >
                  threshold;

                if (
                  v0 !== v1 ||
                  v0 !== v2 ||
                  v0 !== v3 ||
                  v0 !== v4 ||
                  v0 !== v5 ||
                  v0 !== v6 ||
                  v0 !== v7
                ) {
                  let sumX = 0,
                    sumY = 0,
                    sumZ = 0,
                    totalWeight = 0;

                  const corners = [
                    { x, y, z, val: getValue(x, y, z) },
                    {
                      x: x + sampleStep,
                      y,
                      z,
                      val: getValue(x + sampleStep, y, z),
                    },
                    {
                      x,
                      y: y + sampleStep,
                      z,
                      val: getValue(x, y + sampleStep, z),
                    },
                    {
                      x: x + sampleStep,
                      y: y + sampleStep,
                      z,
                      val: getValue(x + sampleStep, y + sampleStep, z),
                    },
                    {
                      x,
                      y,
                      z: z + sampleStep,
                      val: getValue(x, y, z + sampleStep),
                    },
                    {
                      x: x + sampleStep,
                      y,
                      z: z + sampleStep,
                      val: getValue(x + sampleStep, y, z + sampleStep),
                    },
                    {
                      x,
                      y: y + sampleStep,
                      z: z + sampleStep,
                      val: getValue(x, y + sampleStep, z + sampleStep),
                    },
                    {
                      x: x + sampleStep,
                      y: y + sampleStep,
                      z: z + sampleStep,
                      val: getValue(
                        x + sampleStep,
                        y + sampleStep,
                        z + sampleStep,
                      ),
                    },
                  ];

                  for (const corner of corners) {
                    const weight =
                      1.0 / (Math.abs(corner.val - threshold) + 0.0001);
                    sumX += corner.x * weight;
                    sumY += corner.y * weight;
                    sumZ += corner.z * weight;
                    totalWeight += weight;
                  }

                  const vx = (sumX / totalWeight - nx / 2) / 100;
                  const vy = (sumY / totalWeight - ny / 2) / 100;
                  const vz = (sumZ / totalWeight - nz / 2) / 100;

                  const vIdx = vertices.length / 3;
                  vertices.push(vx, vy, vz);
                  grid.set(`${x},${y},${z}`, vIdx);
                }
              }
            }
          }

          for (let z = 0; z < nz - sampleStep; z += sampleStep) {
            for (let y = 0; y < ny - sampleStep; y += sampleStep) {
              for (let x = 0; x < nx - sampleStep; x += sampleStep) {
                const v0 = getValue(x, y, z) > threshold;
                const v1 = getValue(x + sampleStep, y, z) > threshold;
                const v2 = getValue(x, y + sampleStep, z) > threshold;
                const v4 = getValue(x, y, z + sampleStep) > threshold;

                if (v0 !== v1) {
                  const i0 = grid.get(`${x},${y},${z}`);
                  const i1 = grid.get(`${x},${y - sampleStep},${z}`);
                  const i2 = grid.get(
                    `${x},${y - sampleStep},${z - sampleStep}`,
                  );
                  const i3 = grid.get(`${x},${y},${z - sampleStep}`);
                  if (
                    i0 !== undefined &&
                    i1 !== undefined &&
                    i2 !== undefined &&
                    i3 !== undefined
                  ) {
                    if (v0) indices.push(i0, i1, i2, i0, i2, i3);
                    else indices.push(i0, i2, i1, i0, i3, i2);
                  }
                }
                if (v0 !== v2) {
                  const i0 = grid.get(`${x},${y},${z}`);
                  const i1 = grid.get(`${x - sampleStep},${y},${z}`);
                  const i2 = grid.get(
                    `${x - sampleStep},${y},${z - sampleStep}`,
                  );
                  const i3 = grid.get(`${x},${y},${z - sampleStep}`);
                  if (
                    i0 !== undefined &&
                    i1 !== undefined &&
                    i2 !== undefined &&
                    i3 !== undefined
                  ) {
                    if (v0) indices.push(i0, i2, i1, i0, i3, i2);
                    else indices.push(i0, i1, i2, i0, i2, i3);
                  }
                }
                if (v0 !== v4) {
                  const i0 = grid.get(`${x},${y},${z}`);
                  const i1 = grid.get(`${x - sampleStep},${y},${z}`);
                  const i2 = grid.get(
                    `${x - sampleStep},${y - sampleStep},${z}`,
                  );
                  const i3 = grid.get(`${x},${y - sampleStep},${z}`);
                  if (
                    i0 !== undefined &&
                    i1 !== undefined &&
                    i2 !== undefined &&
                    i3 !== undefined
                  ) {
                    if (v0) indices.push(i0, i1, i2, i0, i2, i3);
                    else indices.push(i0, i2, i1, i0, i3, i2);
                  }
                }
              }
            }
          }

          if (vertices.length === 0) {
            finalize(
              new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)),
              file.name,
              "nii",
            );
            return;
          }

          const finalGeo = new THREE.BufferGeometry();
          finalGeo.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3),
          );
          finalGeo.setIndex(indices);

          const posAttr = finalGeo.getAttribute("position");
          const vertexCount = posAttr.count;
          const adj: Set<number>[] = Array.from(
            { length: vertexCount },
            () => new Set(),
          );

          for (let i = 0; i < indices.length; i += 3) {
            const a = indices[i];
            const b = indices[i + 1];
            const c = indices[i + 2];
            adj[a].add(b);
            adj[a].add(c);
            adj[b].add(a);
            adj[b].add(c);
            adj[c].add(a);
            adj[c].add(b);
          }

          for (let pass = 0; pass < 2; pass++) {
            const newPos = new Float32Array(vertexCount * 3);
            for (let i = 0; i < vertexCount; i++) {
              const neighbors = adj[i];
              if (neighbors.size > 0) {
                let sx = 0,
                  sy = 0,
                  sz = 0;
                neighbors.forEach((nIdx) => {
                  sx += posAttr.getX(nIdx);
                  sy += posAttr.getY(nIdx);
                  sz += posAttr.getZ(nIdx);
                });
                newPos[i * 3] =
                  posAttr.getX(i) * 0.5 + (sx / neighbors.size) * 0.5;
                newPos[i * 3 + 1] =
                  posAttr.getY(i) * 0.5 + (sy / neighbors.size) * 0.5;
                newPos[i * 3 + 2] =
                  posAttr.getZ(i) * 0.5 + (sz / neighbors.size) * 0.5;
              } else {
                newPos[i * 3] = posAttr.getX(i);
                newPos[i * 3 + 1] = posAttr.getY(i);
                newPos[i * 3 + 2] = posAttr.getZ(i);
              }
            }
            for (let i = 0; i < vertexCount * 3; i++) {
              (posAttr.array as Float32Array)[i] = newPos[i];
            }
          }

          finalGeo.computeVertexNormals();

          const finalMesh = new THREE.Mesh(
            finalGeo,
            new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.1,
              roughness: 0.6,
              flatShading: false,
            }),
          );
          finalize(finalMesh, file.name, "nii");
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported format"));
    }
  });
};
