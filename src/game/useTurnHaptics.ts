import { useEffect, useRef } from 'react'
import { currentPlayer } from './reducer'
import type { GameState } from './types'

const PULSE_MS = 30

/**
 * A short vibration when the turn passes to the other player. Android only:
 * iOS Safari has no Vibration API, so `navigator.vibrate` is simply missing there.
 */
export function useTurnHaptics(game: GameState | null) {
  const player = game?.phase === 'card' ? currentPlayer(game) : null
  const previous = useRef(player)

  useEffect(() => {
    if (player !== null && previous.current !== null && player !== previous.current) navigator.vibrate?.(PULSE_MS)
    previous.current = player
  }, [player])
}
