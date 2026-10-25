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
 * Shuffle, then reshuffle with the next PRNG values while one theme comes up three times in a row.
 * Still deterministic per seed.
 */
function smoothShuffle(cards: readonly Card[], rand: () => number): Card[] {
  let a = shuffle(cards, rand)
  for (let tries = 0; tries < MAX_RESHUFFLES && hasThemeRun(a); tries++) a = shuffle(cards, rand)
  return a
}

/**
 * The deal order. 'listed' is the approved list exactly, card by card, as cards.json orders it.
 * 'random' mixes rounds 1–3 (never one theme three times in a row); Nosso futuro still closes the game, in list order.
 */
export function buildDeck(cards: readonly Card[], s: Pick<GameState, 'seed' | 'order'>): string[] {
  if (s.order === 'listed') return cards.map((c) => c.id)
  const rand = mulberry32(s.seed)
  const mixed = smoothShuffle(cards.filter((c) => c.round !== 4), rand)
  return [...mixed, ...cards.filter((c) => c.round === 4)].map((c) => c.id)
}

export function newSeed(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] >>> (32 - SEED_BITS)
}
