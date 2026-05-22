# Agent Guide for wavesurfer-wasm-async

This document provides essential context for AI coding agents working on this project.

## Project Overview

`wavesurfer-wasm-async` is an audio waveform player library based on wavesurfer.js, with an added WebAssembly (WASM) async rendering patch. It renders interactive audio waveforms in the browser using Canvas 2D, supports plugins, and can offload waveform path calculations to a Rust/WASM Web Worker for better performance.

Key capabilities:
- Audio waveform visualization with customizable styling (bars, lines, colors)
- Playback control via HTMLMediaElement or Web Audio API backend
- Plugin architecture for extending functionality (regions, spectrogram, timeline, zoom, etc.)
- Three rendering modes: synchronous (`sync`), Web Worker (`worker`), and WASM-accelerated (`worker` with Rust)
- Reactive state management using a custom signal-based system

## Technology Stack

- **Language**: TypeScript (ES modules, `"type": "module"`)
- **Package Manager**: Yarn 1.22.22
- **Bundler**: Rollup with plugins for TypeScript, terser, DTS generation, and web workers
- **WASM Toolchain**: Rust + wasm-pack + wasm-bindgen
- **Unit Testing**: Jest with ts-jest (jsdom environment)
- **E2E Testing**: Cypress with cypress-image-snapshot for visual regression testing
- **Linting**: ESLint (flat config) with TypeScript and Prettier integration

## Project Structure

```
├── src/                          # Main TypeScript source code
│   ├── wavesurfer.ts             # Core WaveSurfer class and public API
│   ├── renderer.ts               # Canvas rendering engine, DOM construction, worker orchestration
│   ├── renderer-utils.ts         # Rendering math: bar/line path calculations, clipping, scaling
│   ├── player.ts                 # HTMLMediaElement wrapper with reactive signals
│   ├── webaudio.ts               # Web Audio API backend player implementation
│   ├── decoder.ts                # Audio decoding (ArrayBuffer -> AudioBuffer) and peak normalization
│   ├── fetcher.ts                # Fetch wrapper with download progress tracking
│   ├── event-emitter.ts          # Typed event emitter base class
│   ├── base-plugin.ts            # Base class for all plugins
│   ├── dom.ts                    # Lightweight DOM element factory
│   ├── timer.ts                  # requestAnimationFrame-based timer
│   ├── draggable.ts              # Pointer-based drag interaction utility (deprecated)
│   ├── fft.ts                    # FFT utilities for spectrogram plugins
│   ├── reactive/                 # Custom signal-based reactivity system
│   │   ├── store.ts              # Signal primitive (writable/readable + computed + effects)
│   │   ├── drag-stream.ts        # Reactive drag gesture stream
│   │   ├── scroll-stream.ts      # Reactive scroll gesture stream
│   │   ├── render-scheduler.ts   # Batched rendering scheduler
│   │   ├── state-event-emitter.ts# Bridges reactive state to event emissions
│   │   └── __tests__/            # Unit tests for reactive primitives
│   ├── state/
│   │   ├── wavesurfer-state.ts   # Centralized reactive state container
│   │   └── __tests__/            # State unit tests
│   ├── worker/
│   │   ├── drawChannelWASM.worker.ts  # Web Worker that hosts Rust/WASM path calculations
│   │   ├── drawChannel.worker.ts      # Alternative pure-JS worker (not currently used)
│   │   └── worker.type.ts             # TypeScript interface for worker API
│   ├── comlink/
│   │   ├── comlink.js            # Comlink UMD bundle for worker RPC
│   │   └── comlink.d.ts          # Comlink type declarations
│   ├── plugins/                  # Official plugins
│   │   ├── envelope.ts
│   │   ├── hover.ts
│   │   ├── minimap.ts
│   │   ├── record.ts
│   │   ├── regions.ts
│   │   ├── spectrogram.ts
│   │   ├── spectrogram-windowed.ts
│   │   ├── spectrogram-worker.ts
│   │   ├── timeline.ts
│   │   └── zoom.ts
│   ├── types/
│   │   └── worker.d.ts           # Web Worker type declarations
│   └── __tests__/                # Jest unit tests for core modules
├── surfer-calc-module/           # Rust/WASM package
│   ├── Cargo.toml
│   ├── src/lib.rs                # `calc_paths` function: computes waveform path points in Rust
│   └── pkg/                      # wasm-pack output (generated, not committed)
├── examples/                     # HTML/JS usage examples and demo pages
├── cypress/
│   ├── e2e/                      # Cypress end-to-end test specs
│   ├── snapshots/                # Image snapshot baselines for visual regression
│   └── support/                  # Cypress commands and plugins
├── scripts/
│   ├── clean.cjs                 # Removes `dist/` before builds
│   ├── plugin.sh                 # Scaffold a new plugin from template
│   └── plugin.ts.template        # Plugin boilerplate
├── dist/                         # Build output (generated, not committed)
└── .github/workflows/            # CI/CD: unit tests, e2e, lint, release
```

## Build System

### Key Commands

| Command | Description |
|---------|-------------|
| `yarn build:wasm` | Build the Rust module to WASM via `wasm-pack build --target web --out-dir pkg` |
| `yarn clean` | Delete the `dist/` directory |
| `yarn build` | Full production build: clean + WASM + TypeScript compilation + Rollup bundling |
| `yarn build:dev` | Development build with TypeScript watch mode |
| `yarn dev` | Rollup watch mode (rebuilds on file changes) |
| `yarn start` | Runs `build:dev` and serves the project on port 9091 |
| `yarn serve` | Serves the project with live-server on port 9091 |

### Build Outputs

Rollup (`rollup.config.js`) produces multiple formats for the core library and each plugin:
- **ESM**: `dist/wavesurfer.esm.js`, `dist/plugins/*.esm.js`
- **CommonJS**: `dist/wavesurfer.cjs`, `dist/plugins/*.cjs`
- **UMD (browser)**: `dist/wavesurfer.min.js`, `dist/plugins/*.min.js`
- **Type definitions**: `dist/wavesurfer.d.ts`, `dist/types.d.ts`

A separate worker bundle (`rollup.config.worker.js`) builds `src/worker/drawChannelWASM.worker.ts` into `dist/draw.worker.js` and copies the `.wasm` binary and Comlink JS into `dist/`.

### WASM Integration Flow

1. `surfer-calc-module/src/lib.rs` exposes `calc_paths` via `wasm-bindgen`
2. `wasm-pack build` generates JS bindings + `.wasm` into `surfer-calc-module/pkg/`
3. Rollup copies `.wasm` and `comlink.js` into `dist/`
4. `Renderer` (when `renderMode === 'worker'`) instantiates `draw.worker.js`
5. The worker loads the WASM module, initializes it, and exposes `DrawApi` via Comlink
6. `Renderer` calls `drawChannel` on the worker to get waveform path points asynchronously

## Code Style Guidelines

- Use TypeScript with ES modules. All imports must include `.ts` extensions.
- Follow Prettier config:
  - 2 spaces indentation
  - Print width: 120
  - Single quotes
  - No semicolons
  - Trailing commas
- Run `yarn lint` after making changes.
- Do not commit files from `dist/` or `node_modules/`.

## Testing

### Unit Tests (Jest)

- **Command**: `yarn test:unit`
- **Config**: `jest.config.js` uses `ts-jest/presets/default-esm` with `jsdom` environment
- **Coverage**: Enabled by default, collected from `src/**/*.ts`
- **Location**: Co-located `__tests__/` directories within `src/` and its subfolders
- Tests mock dependencies heavily (e.g., `renderer.ts` and `timer.ts` are mocked in `wavesurfer.test.ts`).

### E2E Tests (Cypress)

- **Command**: `yarn test` (headless Chrome) or `yarn cypress` (interactive)
- **Config**: `cypress.config.js` disables video, uses `cypress-image-snapshot` for visual regression
- Chrome is forced to `--force-device-scale-factor=1` for consistent rendering across machines
- Tests load `cypress/e2e/index.html` which exposes `WaveSurfer` as a global UMD variable
- On failure, Cypress screenshots are uploaded as CI artifacts

### CI Pipeline

All run on `ubuntu-latest` for pull requests:
- **Unit Tests** (`unit-tests.yml`): `yarn test:unit`
- **E2E Tests** (`e2e.yml`): build + Cypress on Chrome
- **Lint** (`lint.yml`): `yarn lint:report` with PR annotation via `eslint-annotate-action`

Release (`release.yml`) runs on `main` branch pushes: auto-creates Git tag and GitHub release, then publishes to NPM if `package.json` version changed.

## Plugin Development

To scaffold a new plugin:
```bash
yarn make-plugin MyPluginName
```

This generates a file from `scripts/plugin.ts.template` in `src/plugins/`. Plugins extend `BasePlugin` and implement:
- `onInit()` — called after the plugin is attached to a WaveSurfer instance
- `destroy()` — clean up subscriptions and DOM

Plugins are built automatically by Rollup alongside the core library.

## Security Considerations

- The library runs in the browser and does not handle server-side secrets.
- It fetches audio blobs via `fetch()` — users should ensure `url` values are trusted.
- A `cspNonce` option is available for Content Security Policy compatibility.
- Blob URLs created internally are revoked automatically by the `Player` class.

## Pull Request Guidelines

When opening a PR, use the provided template and include:
- **Short description**
- **Implementation details**
- **How to test it**
- **Checklist** with the items from `.github/PULL_REQUEST_TEMPLATE.md`:
  - [ ] This PR is covered by e2e tests
  - [ ] It introduces no breaking API changes

The title should follow the semantic commit convention (e.g., `fix(Regions): remove unused variable`).
