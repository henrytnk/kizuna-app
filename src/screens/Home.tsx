import { Button, Logo } from '../components/ui'
import type { Mode } from '../game/types'

interface Props {
  canContinue: boolean
  savedGameBroken: boolean
  onContinue: () => void
  onNewGame: (mode: Mode) => void
  onJoin: () => void
}

export function Home({ canContinue, savedGameBroken, onContinue, onNewGame, onJoin }: Props) {
  return (
    <div className="screen animate-fade-in">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Logo className="mb-5 w-36" />
        <h1 className="font-display text-4xl font-black tracking-wide text-sky uppercase">Kizuna Quiz</h1>
        <p className="mt-3 text-lg text-muted">Perguntas para criar conexão</p>
        <p className="mt-8 max-w-xs text-sm leading-relaxed text-muted">
          Um celular entre vocês, uma carta por vez, em três rodadas cada vez mais pessoais. Baseado no estudo de
          Arthur Aron sobre como duas pessoas se aproximam. Nada do que vocês disserem fica salvo.
        </p>
        {savedGameBroken && (
          <p role="status" className="mt-6 rounded-xl border border-line px-4 py-3 text-sm text-muted">
            Não deu para abrir o jogo salvo. Comecem um novo jogo.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {canContinue && <Button onClick={onContinue}>Continuar</Button>}
        <Button variant={canContinue ? 'secondary' : 'primary'} onClick={() => onNewGame('conexao')}>
          {savedGameBroken ? 'Começar novo jogo' : 'Novo jogo'}
        </Button>
        <Button variant="secondary" onClick={() => onNewGame('futuro')}>
          Nosso futuro
        </Button>
        <Button variant="ghost" onClick={onJoin}>
          Entrar com código
        </Button>
      </div>
    </div>
  )
}
