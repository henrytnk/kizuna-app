import { useEffect, useState } from 'react'

const TICK_MS = 5000

/** A thin bar filling over the suggested round length. It only suggests: nothing happens when it is full. */
export function RoundTimer({ startedAt, minutes }: { startedAt: number; minutes: number }) {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(t)
  }, [])

  const fraction = Math.min(1, Math.max(0, (now - startedAt) / (minutes * 60_000)))
  const elapsed = Math.round(fraction * minutes)

  return (
    <div
      role="progressbar"
      aria-label="Tempo sugerido da rodada"
      aria-valuemin={0}
      aria-valuemax={minutes}
      aria-valuenow={elapsed}
      aria-valuetext={`${elapsed} de ${minutes} minutos`}
      className="mt-2 h-0.5 overflow-hidden rounded-full bg-line"
    >
      <div
        className="h-full rounded-full bg-gold/60 transition-[width] duration-1000 ease-linear"
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  )
}
