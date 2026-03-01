# 3D Model Viewer

A simple web-based 3D model viewer for viewing, inspecting, and exporting 3D assets. Drag and drop files to load multiple models, then export in STL or GLB format.

I originally made this to convert NIfTI files to STL—and here we are.

## Features

- **Multiple format support** — Load STL, GLB, GLTF, OBJ, PLY, FBX, DAE, 3DS, and NIfTI (.nii, .nii.gz) files.
- **Export** — Export as binary STL or GLB. STL export uses binary format to keep file size close to the original.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:3000`). Use **Build** for a production bundle:

```bash
npm run build
npm run preview
```

## Tech stack

- **React** + **Vite**
- **React Three Fiber** + **Three.js** + **@react-three/drei** for 3D
- **Tailwind CSS** for layout and styling
- **Motion** for UI and loader animations
- **react-dropzone** for file uploads
