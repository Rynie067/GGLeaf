# GGLeaf Studio

A private, browser-based motion graphics editor inspired by the workflow of ccLeaf. This repository is an original implementation; it does not copy ccLeaf source code or redistribute its paid template assets.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

Create a production build:

```bash
npm run build
npm run preview
```

## Included in this first implementation

- Dark studio layout with animation library, layer list, project settings, canvas preview, timeline and inspector.
- Starter template gallery: Minecraft money counter, elimination counter and rank reveal, plus YouTube subscribe, lower-third and title intro.
- Editable text, rectangles, circles and imported image layers.
- Text content, font family, weight, size, alignment, fill, opacity, outline, rotation, position, dimensions and rounded corners.
- Per-layer entrance motion: fade, slide, pop, bounce and zoom.
- Per-layer start time and duration; project duration, resolution and frame rate.
- Live canvas preview, playback, PNG frame export, WebM video recording, JSON project save/load.
- Transparent canvas background option.

## Known limitations / next milestones

This is the working foundation, not feature parity with ccLeaf yet. The current video export is WebM through the browser's MediaRecorder API; MP4 export, audio tracks and beat sync, full keyframe curves, drag-on-canvas transform handles, masks, gradients, motion blur, reusable custom presets, font management and a much larger template library remain to be implemented. Browser support for transparent WebM varies.

## Project format

Projects are saved as portable JSON files containing project settings and editable layer data. Imported image assets are embedded as data URLs in the project file.
