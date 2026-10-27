import { lazy, Suspense, useEffect, type ComponentType, type ReactNode } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router'
import { SessionProvider } from '@/entities/session/model/SessionProvider'
import { useSession } from '@/entities/session/model/useSession'
import { AuthPage } from '@/pages/auth/ui/AuthPage'
import { HomePage, type GameId } from '@/pages/home/ui/HomePage'
import { routes } from '@/shared/config/routes'
import { whenIdle } from '@/shared/lib/schedule'
import { Button, buttonClassName } from '@/shared/ui/Button'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { ErrorScreen } from '@/shared/ui/ErrorScreen'
import './styles/global.css'

/*
 * Both tables carry three.js, and roulette carries a Socket.IO client on top. None
 * of it belongs in the chunk that has to render a sign-in form, so each game is
 * fetched when the player picks it — or a moment earlier, on hover (see
 * `preload` below).
 */
const loaders: Record<GameId, () => Promise<{ default: ComponentType }>> = {
  roulette: () =>
    import('@/pages/roulette/ui/RoulettePage').then((m) => ({ default: m.RoulettePage })),
  slots: () => import('@/pages/slots/ui/SlotsPage').then((m) => ({ default: m.SlotsPage })),
}

const screens: Record<GameId, ComponentType> = {
  roulette: lazy(loaders.roulette),
  slots: lazy(loaders.slots),
}

export function App() {
  return (
    <ErrorBoundary fallback={<AppCrashed />}>
      <BrowserRouter>
        <SessionProvider>
          <Root />
        </SessionProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

function Root() {
  const { user, status } = useSession()

  if (status === 'loading') {
    return <Placeholder>Loading…</Placeholder>
  }

  // Shown at whatever address was opened, so a deep link survives signing in.
  if (!user) return <AuthPage />

  // Keyed by account, so signing in as someone else never inherits the previous
  // player's open game.
  return <Casino key={user.id} />
}

function Casino() {
  const inLobby = useLocation().pathname === routes.lobby

  /* Whichever card the player is reading, they are about to want one of these.
   * Fetching both while the lobby is idle leaves the click nothing to download. */
  useEffect(() => {
    if (!inLobby) return
    return whenIdle(prefetchGames, PREFETCH_DELAY_MS)
  }, [inLobby])

  return (
    <Routes>
      <Route path={routes.lobby} element={<HomePage onPreload={preload} />} />
      <Route path={routes.roulette} element={<Game key="roulette" id="roulette" />} />
      <Route path={routes.slots} element={<Game key="slots" id="slots" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

/*
 * A table that throws — a scene that fails to build, a chunk that no longer
 * exists after a deploy — takes down only itself. The lobby and the session
 * stay put, and the way back is one click.
 */
function Game({ id }: { id: GameId }) {
  const Screen = screens[id]

  return (
    <ErrorBoundary fallback={<GameCrashed />}>
      <Suspense fallback={<Placeholder>Taking a seat…</Placeholder>}>
        <Screen />
      </Suspense>
    </ErrorBoundary>
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

/* A lazy chunk that failed once stays failed, so reloading is the only real retry. */
function reload() {
  window.location.reload()
}

function GameCrashed() {
  return (
    <ErrorScreen
      title="This Table Hit a Problem"
      message="Reload the page to try again. Your balance is kept on the server, so nothing is lost."
      actions={
        <>
          <Button onClick={reload} className="flex-none px-5 py-2.5">
            Reload Page
          </Button>
          <Link to={routes.lobby} className={buttonClassName('secondary', 'px-5 py-2.5')}>
            Back to Lobby
          </Link>
        </>
      }
    />
  )
}

/* Outside the router and the session on purpose: this is what shows when those break. */
function AppCrashed() {
  return (
    <ErrorScreen
      title="Something Went Wrong"
      message="The casino ran into an unexpected error. Reload the page to pick up where you left off."
      actions={
        <Button onClick={reload} className="flex-none px-5 py-2.5">
          Reload Page
        </Button>
      }
    />
  )
}

function NotFound() {
  return (
    <>
      <title>Page Not Found · European Casino</title>
      <ErrorScreen
        alert={false}
        title="Page Not Found"
        message="There is no table at this address. Head back to the lobby to pick a game."
        actions={
          <Link to={routes.lobby} className={buttonClassName('primary', 'flex-none px-5 py-2.5')}>
            Back to Lobby
          </Link>
        }
      />
    </>
  )
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center text-muted">
      {children}
    </div>
  )
}
