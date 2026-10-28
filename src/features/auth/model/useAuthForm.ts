import { useRef } from 'react'
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form'
import { useSession } from '@/entities/session/model/useSession'
import { validateCredentials } from '@/entities/session/model/validateCredentials'
import type { Credentials } from '@/entities/session/model/types'

export type AuthMode = 'login' | 'signup'

/* The two confirmations only exist on sign-up; sign-in leaves them unticked and unread. */
interface AuthFormValues extends Credentials {
  confirmsAdult: boolean
  acceptsTerms: boolean
}

/**
 * The rules stay in the entity — this only restates their answer in the shape
 * react-hook-form expects, so there is still one definition of a valid username.
 */
function validate(values: AuthFormValues, mode: AuthMode): Record<string, string> {
  const errors: Record<string, string> = { ...validateCredentials(values) }

  if (mode === 'signup') {
    if (!values.confirmsAdult) errors.confirmsAdult = 'Confirm you are 18 or older to play.'
    if (!values.acceptsTerms) errors.acceptsTerms = 'Accept the Terms of Use to play.'
  }

  return errors
}

/**
 * Validation runs before anything leaves the browser, and `isSubmitting` comes
 * from the same place the errors do, so the form cannot sit disabled holding a
 * stale message.
 *
 * Fields are uncontrolled — registered by ref — so a keystroke re-renders
 * nothing, and the values survive a failed submit without being mirrored into
 * React state.
 */
export function useAuthForm(mode: AuthMode) {
  const { signIn, signUp } = useSession()

  /* Read through a ref: the resolver is handed to the form once, the mode changes after. */
  const modeRef = useRef(mode)
  modeRef.current = mode

  const resolver: Resolver<AuthFormValues> = (values) => {
    const fields = Object.entries(validate(values, modeRef.current))
    if (fields.length === 0) return { values, errors: {} }

    return {
      values: {},
      errors: Object.fromEntries(
        fields.map(([field, message]) => [field, { type: 'validation', message }]),
      ) as FieldErrors<AuthFormValues>,
    }
  }

  const form = useForm<AuthFormValues>({
    resolver,
    defaultValues: { username: '', password: '', confirmsAdult: false, acceptsTerms: false },
    // Nothing is wrong until you have tried; after that, corrections land as typed.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const { clearErrors, handleSubmit, register, reset, setError } = form

  const submit = handleSubmit(async ({ username, password }) => {
    try {
      // Validation has already insisted on both boxes for sign-up.
      await (mode === 'login'
        ? signIn({ username, password })
        : signUp({ username, password, confirmsAdult: true, acceptsTerms: true }))
      // Success unmounts this screen, so nothing here has to be undone.
    } catch (cause) {
      // `root` is for a rejection that belongs to the pair, not to one field.
      setError('root', { message: describe(cause) })
    }
  })

  /* A field the player is correcting drops the verdict passed on the pair. */
  const forgetFormError = () => clearErrors('root')

  return {
    errors: form.formState.errors,
    pending: form.formState.isSubmitting,
    submit,
    reset,
    username: register('username', {
      // Trailing spaces are a typo, not a username. The input keeps showing what
      // was typed; validation and the request both see this.
      setValueAs: (value: string) => value.trim(),
      onChange: forgetFormError,
    }),
    password: register('password', { onChange: forgetFormError }),
    confirmsAdult: register('confirmsAdult', { onChange: forgetFormError }),
    acceptsTerms: register('acceptsTerms', { onChange: forgetFormError }),
  }
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'
}
