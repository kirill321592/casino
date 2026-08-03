import { describe, expect, it } from 'vitest'
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from './types'
import { validateCredentials } from './validateCredentials'

const VALID_USERNAME = 'player_one'
const VALID_PASSWORD = 'correct-horse'

function chars(length: number): string {
  return 'a'.repeat(length)
}

function usernameError(username: string): string | undefined {
  return validateCredentials({ username, password: VALID_PASSWORD }).username
}

function passwordError(password: string): string | undefined {
  return validateCredentials({ username: VALID_USERNAME, password }).password
}

describe('a payload worth sending', () => {
  it('reports nothing for valid credentials', () => {
    expect(validateCredentials({ username: VALID_USERNAME, password: VALID_PASSWORD })).toEqual({})
  })

  it.each(['abc', 'ABC', '123', 'a_b-c', '_-_', 'Player99'])(
    'accepts %p as a username',
    (username) => {
      expect(usernameError(username)).toBeUndefined()
    },
  )

  it('accepts any characters in a password — only length is checked here', () => {
    expect(passwordError('  ¡¿ Ünï©ode 🎰  ')).toBeUndefined()
  })
})

describe('username', () => {
  it('asks for one when it is missing', () => {
    expect(usernameError('')).toBe('Enter a username.')
  })

  it('reports the empty field rather than its length', () => {
    // '' is also too short; the more useful message has to win.
    expect(usernameError('')).not.toContain('at least')
  })

  it('rejects one character below the minimum', () => {
    expect(usernameError(chars(USERNAME_MIN_LENGTH - 1))).toBe(
      `Usernames are at least ${USERNAME_MIN_LENGTH} characters.`,
    )
  })

  it('accepts exactly the minimum', () => {
    expect(usernameError(chars(USERNAME_MIN_LENGTH))).toBeUndefined()
  })

  it('accepts exactly the maximum', () => {
    expect(usernameError(chars(USERNAME_MAX_LENGTH))).toBeUndefined()
  })

  it('rejects one character above the maximum', () => {
    expect(usernameError(chars(USERNAME_MAX_LENGTH + 1))).toBe(
      `Usernames are at most ${USERNAME_MAX_LENGTH} characters.`,
    )
  })

  it.each(['has space', 'dot.name', 'bang!', 'sla/sh', 'квас', 'emo🎰ji', 'semi;colon'])(
    'rejects %p on its characters',
    (username) => {
      expect(usernameError(username)).toBe('Use only letters, numbers, underscores and hyphens.')
    },
  )

  it('does not trim — whitespace is a character like any other', () => {
    // The form strips trailing spaces before it gets here; this rule stays strict
    // so an untrimmed caller is told, not silently corrected.
    expect(usernameError('player ')).toBe('Use only letters, numbers, underscores and hyphens.')
  })

  it('reports length before characters', () => {
    expect(usernameError('a!')).toContain('at least')
  })
})

describe('password', () => {
  it('asks for one when it is missing', () => {
    expect(passwordError('')).toBe('Enter a password.')
  })

  it('reports the empty field rather than its length', () => {
    expect(passwordError('')).not.toContain('at least')
  })

  it('rejects one character below the minimum', () => {
    expect(passwordError(chars(PASSWORD_MIN_LENGTH - 1))).toBe(
      `Passwords are at least ${PASSWORD_MIN_LENGTH} characters.`,
    )
  })

  it('accepts exactly the minimum', () => {
    expect(passwordError(chars(PASSWORD_MIN_LENGTH))).toBeUndefined()
  })

  it('accepts exactly the maximum', () => {
    expect(passwordError(chars(PASSWORD_MAX_LENGTH))).toBeUndefined()
  })

  it('rejects one character above the maximum', () => {
    expect(passwordError(chars(PASSWORD_MAX_LENGTH + 1))).toBe(
      `Passwords are at most ${PASSWORD_MAX_LENGTH} characters.`,
    )
  })
})

describe('both fields', () => {
  it('reports each field independently in one pass', () => {
    expect(validateCredentials({ username: '', password: 'short' })).toEqual({
      username: 'Enter a username.',
      password: `Passwords are at least ${PASSWORD_MIN_LENGTH} characters.`,
    })
  })

  it('says nothing about a field that is fine', () => {
    expect(validateCredentials({ username: 'ok_name', password: 'short' })).not.toHaveProperty(
      'username',
    )
  })
})
