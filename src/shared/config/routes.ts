/* Every URL the app answers to. Anything else lands on the not-found screen. */
export const routes = {
  lobby: '/',
  roulette: '/roulette',
  slots: '/slots',
  /* Public: readable before signing in, and linked from the sign-up form. */
  rules: '/rules',
  terms: '/terms',
  /* Needs an account, since the tools on it act on one. */
  responsibleGaming: '/responsible-gaming',
} as const
