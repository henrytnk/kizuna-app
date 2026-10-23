import { useEffect, useState } from 'react'
import { Button } from '../components/ui'

const DURATION_MS = 2 * 60 * 1000
const FADE_MS = 1500

type Stage = 'ready' | 'dimming' | 'over'

export function EyeContact({ onFinish }: { onFinish: () => void }) {
  const [stage, setStage] = useState<Stage>('ready')

  useEffect(() => {
    if (stage !== 'dimming') return
    const t = setTimeout(() => setStage('over'), DURATION_MS + FADE_MS)
    return () => clearTimeout(t)
  }, [stage])

  return (
    <div className="screen animate-fade-in">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gold">para terminar</p>
        <h1 className="mt-3 font-serif text-4xl">{stage === 'over' ? 'Pronto' : 'Dois minutos de olhar'}</h1>
        <p className="mt-6 max-w-xs text-lg leading-relaxed text-muted">
          {stage === 'over'
            ? 'Fiquem mais um pouco se quiserem.'
            : 'Em silêncio, olhem nos olhos um do outro por dois minutos. A tela escurece e volta quando o tempo acabar.'}
        </p>
      </div>
      {stage === 'over' ? (
        <Button onClick={onFinish}>Ver resumo</Button>
      ) : (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onFinish}>
            Pular
          </Button>
          <Button className="flex-[2]" onClick={() => setStage('dimming')}>
            Começar
          </Button>
        </div>
      )}

      {/* Black veil: fades in, holds for two minutes, fades out on its own. No sound. */}
      <div
        aria-hidden={stage !== 'dimming'}
        className={`fixed inset-0 z-10 flex items-end justify-center bg-black transition-opacity ease-in-out ${
          stage === 'dimming' ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <button
          type="button"
          onClick={() => setStage('over')}
          className="mb-[max(env(safe-area-inset-bottom),24px)] min-h-11 px-6 text-sm text-white/15"
        >
          Parar
        </button>
      </div>
    </div>
  )
}
