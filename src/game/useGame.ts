import { useEffect, useReducer, useState } from 'react'
import { reducer } from './reducer'
import { loadGame, saveGame } from './storage'

export function useGame() {
  const [loaded] = useState(loadGame)
  const [game, dispatch] = useReducer(reducer, loaded.status === 'ok' ? loaded.game : null)

  useEffect(() => saveGame(game), [game])

  return { game, dispatch, loadStatus: loaded.status }
}
