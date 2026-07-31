/*
 * Both games live on the same server: roulette on a Socket.IO namespace, since
 * its rounds are shared and server-timed, and slots over plain HTTP, since a
 * spin is one request with one answer.
 */
export const gameServerUrl =
  import.meta.env.VITE_GAME_SERVER_URL ??
  import.meta.env.VITE_ROULETTE_SERVER_URL ??
  'http://localhost:3000'

/** Any namespace emits this when a payload fails server-side validation. */
export interface GameError {
  message: string
}
