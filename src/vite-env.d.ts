/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Hand-landmarker model (.task) URL — CDN or self-hosted /models path. */
  readonly VITE_MEDIAPIPE_MODEL_URL: string
  /** Folder serving the MediaPipe wasm files. */
  readonly VITE_MEDIAPIPE_WASM_URL: string
  /** Default sound-effects volume (0..1). */
  readonly VITE_DEFAULT_VOLUME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
