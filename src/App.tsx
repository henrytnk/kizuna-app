import { useEffect, useState } from 'react'
import { RoundTimer } from './components/RoundTimer'
import { newSeed } from './game/deck'
import { type Invite, parseInviteHash } from './game/gameCode'
import { currentCard, type NewGameOptions, segmentOf } from './game/reducer'
import { SEGMENTS } from './game/rounds'
import { useGame } from './game/useGame'
import { useTurnHaptics } from './game/useTurnHaptics'
import { useWakeLock } from './game/useWakeLock'
import { CardScreen } from './screens/CardScreen'
import { End } from './screens/End'
import { EyeContact } from './screens/EyeContact'
import { GameHeader } from './screens/GameHeader'
import { Home } from './screens/Home'
import { RoundIntro } from './screens/RoundIntro'
import { Setup } from './screens/Setup'

type View = 'home' | 'setup' | 'join' | 'game'

export default function App() {
  const { game, dispatch, loadStatus } = useGame()
  // Opened from a second-phone link (#g=…): go straight to joining that game.
  const [invite, setInvite] = useState<Invite | null>(() => parseInviteHash(location.hash))
  const [view, setView] = useState<View>(invite ? 'join' : 'home')
  const wakeLockOk = useWakeLock(view === 'game' && game !== null && game.phase !== 'done')
  useTurnHaptics(view === 'game' ? game : null)

  useEffect(() => {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search)
  }, [])

  const start = (o: Omit<NewGameOptions, 'seed'> & { seed?: number }) => {
    dispatch({ type: 'START', ...o, seed: o.seed ?? newSeed(), tableMode: game?.tableMode })
    setView('game')
  }

  if (view === 'setup' || view === 'join') {
    const joining = view === 'join'
    return (
      <Setup
        key={view}
        joining={joining}
        initial={joining && invite ? { players: game?.players, ...invite } : (game ?? undefined)}
        onStart={start}
        onBack={() => setView('home')}
      />
    )
  }

  if (view === 'home' || !game) {
    return (
      <Home
        canContinue={game !== null && game.phase !== 'done'}
        savedGameBroken={loadStatus === 'invalid' && game === null}
        onContinue={() => setView('game')}
        onNewGame={() => setView('setup')}
        onJoin={() => {
          setInvite(null)
          setView('join')
        }}
      />
    )
  }

  if (game.phase === 'eye-contact') return <EyeContact onFinish={() => dispatch({ type: 'FINISH' })} />

  if (game.phase === 'done') {
    return (
      <End
        game={game}
        onPlayAgain={() => start({ ...game, seed: undefined })}
        onHome={() => {
          dispatch({ type: 'RESET' })
          setView('home')
        }}
      />
    )
  }

  const card = currentCard(game)

  return (
    <div className="screen">
      <GameHeader
        game={game}
        onExit={() => setView('home')}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onToggleTable={() => dispatch({ type: 'TOGGLE_TABLE' })}
      />
      {game.phase === 'round-intro' ? (
        <>
          {!wakeLockOk && (
            <p role="note" className="mt-3 text-center text-sm text-muted">
              Dica: aumente o tempo de bloqueio automático do celular para a tela não apagar.
            </p>
          )}
          <RoundIntro game={game} onBegin={() => dispatch({ type: 'BEGIN_ROUND', at: Date.now() })} />
        </>
      ) : (
        <>
          {card && game.roundStartedAt !== undefined && (
            <RoundTimer
              key={game.roundStartedAt}
              startedAt={game.roundStartedAt}
              minutes={SEGMENTS[segmentOf(card, game.order)].minutes}
            />
          )}
          <CardScreen
            game={game}
            onAnswered={() => dispatch({ type: 'ANSWERED' })}
            onPass={() => dispatch({ type: 'PASS' })}
          />
        </>
      )}
    </div>
  )
}
