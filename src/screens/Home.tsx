import { Button, Logo } from '../components/ui'

interface Props {
  canContinue: boolean
  savedGameBroken: boolean
  onContinue: () => void
  onNewGame: () => void
}

export function Home({ canContinue, savedGameBroken, onContinue, onNewGame }: Props) {
  return (
    <div className="screen animate-fade-in">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Logo className="mb-6 w-28" />
        <h1 className="font-serif text-5xl tracking-wide">Kizuna</h1>
        <p className="mt-3 text-lg text-muted">Perguntas para criar conexão</p>
        <p className="mt-8 max-w-xs text-sm leading-relaxed text-muted">
          Um celular entre vocês, uma carta por vez. Os dois respondem, cada um na sua vez. Nada do que vocês
          disserem fica salvo.
        </p>
        {savedGameBroken && (
          <p role="status" className="mt-6 rounded-xl border border-line px-4 py-3 text-sm text-muted">
            Não deu para abrir o jogo salvo. Comecem um novo jogo.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {canContinue && <Button onClick={onContinue}>Continuar</Button>}
        <Button variant={canContinue ? 'secondary' : 'primary'} onClick={onNewGame}>
          {savedGameBroken ? 'Começar novo jogo' : 'Novo jogo'}
        </Button>
      </div>
    </div>
  )
}
