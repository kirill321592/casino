import { useEffect, useRef } from 'react'
import { useSession } from '@/entities/session/model/useSession'
import { useRouletteStore } from './rouletteStore'

/**
 * Everything the table needs that isn't rendering: one live socket for as long
 * as the screen is mounted, and the settled balance carried back so the lobby
 * and the slots table agree. Call it once, from the page.
 */
export function useRouletteTable(): void {
  const { user, setBalance } = useSession()
  const connect = useRouletteStore((store) => store.connect)
  const balance = useRouletteStore((store) => store.balance)

  /*
   * The balance to open with is the one on screen when the player sits down.
   * Held in a ref on purpose: the effect below feeds the session, the session
   * feeds `user.balance`, and depending on it here would reconnect the socket
   * on every settled round.
   */
  const openingBalance = useRef(user?.balance ?? 0)

  useEffect(() => connect(openingBalance.current), [connect])

  useEffect(() => setBalance(balance), [balance, setBalance])
}
