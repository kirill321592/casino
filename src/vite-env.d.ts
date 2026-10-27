/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the game server. Checked at build time by `vite.config.ts`. */
  readonly VITE_GAME_SERVER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
