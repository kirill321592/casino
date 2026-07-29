import { useContext } from 'react'
import { RouletteContext, type RouletteContextValue } from './rouletteContext'

export function useRoulette(): RouletteContextValue {
  const context = useContext(RouletteContext)
  if (!context) {
    throw new Error('useRoulette must be used within RouletteProvider')
  }

  return context
}
