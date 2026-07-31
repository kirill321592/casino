import { gameServerUrl, type GameError } from './gameServer'

export function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { signal })
}

export function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
}

/**
 * One round trip to the game server. Every failure — unreachable host, rejected
 * payload, non-JSON body — arrives as an Error carrying a message that is safe
 * to put in front of the player.
 */
async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${gameServerUrl}${path}`, { credentials: 'include', ...init })
  } catch (cause) {
    throw new Error('Unable to reach the game server.', { cause })
  }

  if (!response.ok) throw new Error(await readErrorMessage(response))
  return (await response.json()) as T
}

/* The server reports failures as a GameError body; anything else is just a status. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Partial<GameError>
    if (body.message) return body.message
  } catch {
    // Not a JSON error body — fall through to the status.
  }

  return `The game server returned an error (${response.status}).`
}
