import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import { SessionProvider } from '@/entities/session/model/SessionProvider'
import { useSession } from '@/entities/session/model/useSession'
import { AuthPage } from '@/pages/auth/ui/AuthPage'
import { HomePage, type GameId } from '@/pages/home/ui/HomePage'
import { whenIdle } from '@/shared/lib/schedule'
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

  /* Whichever card the player is reading, they are about to want one of these.
   * Fetching both while the lobby is idle leaves the click nothing to download. */
  useEffect(() => {
    if (game !== null) return
    return whenIdle(prefetchGames, PREFETCH_DELAY_MS)
  }, [game])

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

/* Long enough that the lobby's own work is finished, short enough that a player
 * reading the two cards is still reading them when the fetch starts. */
const PREFETCH_DELAY_MS = 1500

function prefetchGames() {
  /* Between them the tables are most of the app's JavaScript — not something to
   * spend on someone's behalf when they have asked the browser to go easy. */
  const { connection } = navigator as Navigator & { connection?: { saveData?: boolean } }
  if (connection?.saveData) return

  for (const load of Object.values(loaders)) void load()
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center text-muted">
      {children}
    </div>
  )
}
