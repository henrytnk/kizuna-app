import type { Card, GameState } from './types'

const SEED_BITS = 20
const MAX_RESHUFFLES = 500

/** Small deterministic PRNG: same seed, same sequence on every device. */
export function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates: every order equally likely, every card exactly once. */
export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function hasThemeRun(cards: readonly Card[], length = 3): boolean {
  let run = 1
  for (let i = 1; i < cards.length; i++) {
    run = cards[i].theme === cards[i - 1].theme ? run + 1 : 1
    if (run >= length) return true
  }
  return false
}

/**
 * Shuffle, then reshuffle with the next PRNG values while one theme comes up `maxRun` times in a row.
 * Still deterministic per seed.
 */
function smoothShuffle(cards: readonly Card[], rand: () => number, maxRun: number): Card[] {
  let a = shuffle(cards, rand)
  for (let tries = 0; tries < MAX_RESHUFFLES && hasThemeRun(a, maxRun); tries++) a = shuffle(cards, rand)
  return a
}

export function buildDeck(
  cards: readonly Card[],
  s: Pick<GameState, 'seed' | 'order' | 'includeBonus'>,
): string[] {
  const rand = mulberry32(s.seed)
  const main = cards.filter((c) => c.round !== 'bonus')
  // By round, the guide's order: passado, presente and futuro take turns, never the same theme twice in a row.
  // Fully random only avoids three in a row, so it stays surprising.
  const ordered =
    s.order === 'random'
      ? smoothShuffle(main, rand, 3)
      : ([1, 2, 3] as const).flatMap((r) => smoothShuffle(main.filter((c) => c.round === r), rand, 2))
  const bonus = s.includeBonus ? cards.filter((c) => c.round === 'bonus') : []
  return [...ordered, ...bonus].map((c) => c.id)
}

export function newSeed(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] >>> (32 - SEED_BITS)
}
