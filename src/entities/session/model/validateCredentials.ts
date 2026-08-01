import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
  type Credentials,
} from './types'

export type CredentialField = keyof Credentials
export type CredentialErrors = Partial<Record<CredentialField, string>>

/**
 * One message per field, most specific first — an empty result means the payload
 * is worth sending. Deliberately says the same thing for sign-in and sign-up:
 * the server validates both against one DTO, so a shorter client-side rule for
 * sign-in would only trade a clear message for a 400.
 */
export function validateCredentials({ username, password }: Credentials): CredentialErrors {
  const errors: CredentialErrors = {}

  if (!username) {
    errors.username = 'Enter a username.'
  } else if (username.length < USERNAME_MIN_LENGTH) {
    errors.username = `Usernames are at least ${USERNAME_MIN_LENGTH} characters.`
  } else if (username.length > USERNAME_MAX_LENGTH) {
    errors.username = `Usernames are at most ${USERNAME_MAX_LENGTH} characters.`
  } else if (!USERNAME_REGEX.test(username)) {
    errors.username = 'Use only letters, numbers, underscores and hyphens.'
  }

  if (!password) {
    errors.password = 'Enter a password.'
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Passwords are at least ${PASSWORD_MIN_LENGTH} characters.`
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Passwords are at most ${PASSWORD_MAX_LENGTH} characters.`
  }

  return errors
}
