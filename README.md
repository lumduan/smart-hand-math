# SmartHand Math ✋🧮

An interactive, hands-free mental-math game for kids. Players answer questions by
**holding up their fingers to the webcam** — hand gestures are read in real time
with [MediaPipe](https://developers.google.com/mediapipe) and turned into numbers.

Built with **React + Vite + TypeScript**, styled with **Tailwind CSS + DaisyUI**,
containerized with **Docker**.

## Features

- 🖐️ Real-time finger counting via MediaPipe `HandLandmarker` (1–2 hands)
- ➕➖✖️ Mental-math question generator with an easy → medium → hard difficulty curve
- 🔊 Game sound effects (Howler.js), mirrored-camera toggle, mute toggle
- 💾 Persistent best score and settings in `localStorage`
- 🎈 Kid-friendly UI, accessible number-pad fallback (no camera required)

## Getting started (local)

```bash
npm install
npm run dev          # http://localhost:5173
```

> The camera requires a **secure context**. `localhost` counts as secure.
> For other hosts, serve over HTTPS.

### Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with HMR           |
| `npm run build`     | Type-check and produce a production bundle   |
| `npm run preview`   | Preview the production build locally         |
| `npm run lint`      | Run ESLint                                   |
| `npm run typecheck` | Run `tsc` without emitting                   |

## Docker

**Development** (hot-reload inside the container, source bind-mounted):

```bash
docker compose up          # dev server on http://localhost:5173
```

**Production** (multi-stage build → nginx serving static files):

```bash
docker compose --profile prod up --build   # on http://localhost:8080
```

## Project structure

```
smart-hand-math/
├── public/            # static assets (audio, models, favicon)
├── src/
│   ├── components/    # common UI, camera wrapper, game widgets
│   ├── context/       # GameContext, AppSettingsContext
│   ├── hooks/         # useAudio, useHandTracker
│   ├── layouts/       # MainLayout
│   ├── pages/         # Home, Learn, Play
│   ├── utils/         # fingerMathLogic, mathGenerator
│   ├── App.tsx        # routes
│   └── main.tsx       # entry point + providers
├── Dockerfile         # multi-stage production build
├── docker-compose.yml # dev orchestrator (+ optional prod profile)
└── ...config
```

## Configuration

Environment variables (see `.env.example`) are exposed to the browser via the
`VITE_` prefix:

| Variable                    | Default                | Purpose                                      |
| --------------------------- | ---------------------- | -------------------------------------------- |
| `VITE_MEDIAPIPE_MODEL_URL`  | Google CDN `.task`     | Hand-landmarker model URL                    |
| `VITE_MEDIAPIPE_WASM_URL`   | jsDelivr CDN           | MediaPipe wasm folder                        |
| `VITE_DEFAULT_VOLUME`       | `0.6`                  | Default sound-effects volume (0..1)          |

To self-host the model instead of using the CDN, download the files into
`public/models/` and set `VITE_MEDIAPIPE_MODEL_URL=/models/hand_landmarker.task`.

## Adding sound effects

Drop the matching files into `public/audio/`: `correct.mp3`, `wrong.mp3`,
`click.mp3`, `win.mp3`, `lose.mp3`. Until then the game runs silently.

## License

MIT
