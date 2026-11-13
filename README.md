# GGLeaf Studio

GGLeaf is a personal motion-graphics editor inspired by the workflow of ccLeaf. It is an original implementation; it does not copy ccLeaf source code or redistribute its paid template assets.

## Windows desktop app

GitHub Actions builds two Windows x64 executables:

- **Installer** — normal Windows setup with Start Menu and optional desktop shortcut.
- **Portable** — a standalone EXE that can be started without running an installer.

Every push to `main` creates a downloadable **GGLeaf-Windows-EXE** artifact in the repository's Actions run. Artifacts are retained for 30 days.

To create a permanent GitHub Release, push a version tag:

```bash
git tag v0.2.0
git push origin v0.2.0
```

The workflow attaches both EXE files to the tagged release automatically.

## Run locally

Requirements: Node.js 24 or newer.

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually http://localhost:5173).

Run the desktop version after building the web app:

```bash
npm run build
npm run desktop
```

Build Windows executables locally on Windows:

```bash
npm run dist:win
```

## Ready-to-edit animation library

The gallery contains original editable starter compositions for Minecraft, YouTube, alerts, gaming, streams, intros, social callouts and outros. Choose a card to load its layers into the editor. Every included layer can be adjusted in the inspector: text, font, size, alignment, colors, opacity, outline, dimensions, position, rotation, corner radius, entrance animation, start time and duration.

Templates are starting points, not flattened video files. Their text and shapes remain editable after loading.

## Current editor features

- Dark studio layout with animation gallery, layer list, project settings, canvas preview, timeline and inspector.
- Editable text, rectangles, circles and imported image layers.
- Fade, slide, pop, bounce and zoom entrance motion.
- Per-layer timing and project duration, resolution and frame rate.
- Live canvas playback and PNG frame export.
- WebM video recording in supported browsers.
- Portable JSON project save/load.
- Transparent canvas background option.
- Windows desktop packaging through Electron and electron-builder.

## Current limitations

This is an evolving first release, not full feature parity with ccLeaf. The current WebM renderer uses browser MediaRecorder; MP4/MOV export, audio tracks and beat sync, advanced keyframe curves, drag-on-canvas transform handles, masks, gradients, motion blur and a larger professionally produced template pack remain future work. Transparent WebM support varies by browser.

The Windows executables are not code-signed yet, so Windows may show an unknown-publisher SmartScreen warning.

## Project format

Projects are saved as JSON files containing project settings and editable layer data. Imported images are embedded as data URLs in the project file.