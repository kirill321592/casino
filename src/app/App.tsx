import { lazy, Suspense, useCallback, useState, type ComponentType, type ReactNode } from 'react'
import { SessionProvider } from '@/entities/session/model/SessionProvider'
import { useSession } from '@/entities/session/model/useSession'
import { AuthPage } from '@/pages/auth/ui/AuthPage'
import { HomePage, type GameId } from '@/pages/home/ui/HomePage'
import './styles/global.css'

/*
 * Both tables carry three.js, and roulette carries a Socket.IO client on top. None
 * of it belongs in the chunk that has to render a sign-in form, so each game is
 * fetched when the player picks it — or a moment earlier, on hover (see
 * `preload` below).
 */
type GameScreen = ComponentType<{ onExit?: () => void }>

const loaders: Record<GameId, () => Promise<{ default: GameScreen }>> = {
  roulette: () =>
    import('@/pages/roulette/ui/RoulettePage').then((m) => ({ default: m.RoulettePage })),
  slots: () => import('@/pages/slots/ui/SlotsPage').then((m) => ({ default: m.SlotsPage })),
}

const screens: Record<GameId, GameScreen> = {
  roulette: lazy(loaders.roulette),
  slots: lazy(loaders.slots),
}

export function App() {
  return (
    <SessionProvider>
      <Root />
    </SessionProvider>
  )
}

function Root() {
  const { user, status } = useSession()

  if (status === 'loading') {
    return <Placeholder>Loading…</Placeholder>
  }

  if (!user) return <AuthPage />

  // Keyed by account, so signing in as someone else never inherits the previous
  // player's open game.
  return <Casino key={user.id} />
}

function Casino() {
  const [game, setGame] = useState<GameId | null>(null)
  const exit = useCallback(() => setGame(null), [])

  if (game === null) {
    return <HomePage onSelect={setGame} onPreload={preload} />
  }

  const Screen = screens[game]

  return (
    <Suspense fallback={<Placeholder>Taking a seat…</Placeholder>}>
      <Screen onExit={exit} />
    </Suspense>
  )
}

/* Pointing at a card is a good enough signal to start the download. */
function preload(game: GameId) {
  void loaders[game]()
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center text-muted">
      {children}
    </div>
  )
}
