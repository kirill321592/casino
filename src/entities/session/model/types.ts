/** The account, as the server is willing to describe it. Never holds the token. */
export interface AuthUser {
  id: string
  username: string
  balance: number
}

export interface Credentials {
  username: string
  password: string
}

/*
 * These mirror the server's CredentialsDto. Checking them here saves a round
 * trip and gives a better message than a 400 does; the server still decides.
 */
export const USERNAME_PATTERN = '[A-Za-z0-9_-]+'
export const USERNAME_REGEX = new RegExp(`^${USERNAME_PATTERN}$`)
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 24
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
