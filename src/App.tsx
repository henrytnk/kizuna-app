import { useState } from 'react'
import { newSeed } from './game/deck'
import type { NewGameOptions } from './game/reducer'
import { useGame } from './game/useGame'
import { useWakeLock } from './game/useWakeLock'
import { CardScreen } from './screens/CardScreen'
import { End } from './screens/End'
import { EyeContact } from './screens/EyeContact'
import { GameHeader } from './screens/GameHeader'
import { Home } from './screens/Home'
import { RoundIntro } from './screens/RoundIntro'
import { Setup } from './screens/Setup'

type View = 'home' | 'setup' | 'game'

export default function App() {
  const { game, dispatch, loadStatus } = useGame()
  const [view, setView] = useState<View>('home')
  const wakeLockOk = useWakeLock(view === 'game' && game !== null && game.phase !== 'done')

  const start = (o: Omit<NewGameOptions, 'seed'>) => {
    dispatch({ type: 'START', ...o, seed: newSeed(), tableMode: game?.tableMode })
    setView('game')
  }

  if (view === 'setup') {
    return <Setup initial={game ?? undefined} onStart={start} onBack={() => setView('home')} />
  }

  if (view === 'home' || !game) {
    return (
      <Home
        canContinue={game !== null && game.phase !== 'done'}
        savedGameBroken={loadStatus === 'invalid' && game === null}
        onContinue={() => setView('game')}
        onNewGame={() => setView('setup')}
      />
    )
  }

  if (game.phase === 'eye-contact') return <EyeContact onFinish={() => dispatch({ type: 'FINISH' })} />

  if (game.phase === 'done') {
    return (
      <End
        game={game}
        onPlayAgain={() => start(game)}
        onHome={() => {
          dispatch({ type: 'RESET' })
          setView('home')
        }}
      />
    )
  }

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
          <RoundIntro game={game} onBegin={() => dispatch({ type: 'BEGIN_ROUND' })} />
        </>
      ) : (
        <CardScreen
          game={game}
          onAnswered={() => dispatch({ type: 'ANSWERED' })}
          onPass={() => dispatch({ type: 'PASS' })}
        />
      )}
    </div>
  )
}
