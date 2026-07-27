/* Both games live on the same server, each on its own Socket.IO namespace. */
export const gameServerUrl =
  import.meta.env.VITE_GAME_SERVER_URL ??
  import.meta.env.VITE_ROULETTE_SERVER_URL ??
  'http://localhost:3000'

/** Any namespace emits this when a payload fails server-side validation. */
export interface GameError {
  message: string
}
