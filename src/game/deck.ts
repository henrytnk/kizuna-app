import type { Card, GameState, Theme } from './types'

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
 * A random order in which no theme comes twice in a row. Picks the next theme weighted by how many of
 * its cards are left, backtracking out of dead ends (a round like 5 + 5 + 2 alternates in only ~1% of
 * plain shuffles, so retrying shuffles is not enough). Deterministic per seed.
 */
export function interleaveThemes(cards: readonly Card[], rand: () => number): Card[] {
  const byTheme = new Map<Theme, Card[]>()
  for (const c of shuffle(cards, rand)) {
    const list = byTheme.get(c.theme)
    if (list) list.push(c)
    else byTheme.set(c.theme, [c])
  }
  const themes = [...byTheme.keys()]
  const left = themes.map((t) => byTheme.get(t)!.length)
  const sequence: number[] = []
  const deadEnds = new Set<string>()

  const place = (last: number): boolean => {
    if (sequence.length === cards.length) return true
    const key = `${left.join()}|${last}`
    if (deadEnds.has(key)) return false
    const options = themes.map((_, i) => i).filter((i) => i !== last && left[i] > 0)
    while (options.length) {
      let r = rand() * options.reduce((sum, i) => sum + left[i], 0)
      let k = 0
      while (k < options.length - 1 && r >= left[options[k]]) r -= left[options[k++]]
      const t = options.splice(k, 1)[0]
      left[t]--
      sequence.push(t)
      if (place(t)) return true
      left[t]++
      sequence.pop()
    }
    deadEnds.add(key)
    return false
  }

  // A mix where one theme outnumbers the rest can't alternate; fall back to a plain shuffle.
  if (!place(-1)) return shuffle(cards, rand)
  const next = themes.map(() => 0)
  return sequence.map((t) => byTheme.get(themes[t])![next[t]++])
}

export function buildDeck(cards: readonly Card[], s: Pick<GameState, 'seed' | 'order'>): string[] {
  const rand = mulberry32(s.seed)
  const closeness = cards.filter((c) => c.round !== 4)
  const byRound = (arrange: (round: Card[]) => Card[]) =>
    ([1, 2, 3] as const).flatMap((r) => arrange(closeness.filter((c) => c.round === r)))

  // Rounds 1–3 by round follow the guide: passado, presente and futuro take turns, never the same theme twice in a row.
  // Fully random only avoids three in a row, so it stays surprising.
  const ordered = s.order === 'random' ? smoothShuffle(closeness, rand) : byRound((round) => interleaveThemes(round, rand))
  // Nosso futuro always closes the game, in either order: its lighter questions first, then the deeper ones.
  const futuro = cards.filter((c) => c.round === 4)
  const lighter = shuffle(futuro.filter((c) => !c.deeper), rand)
  const deeper = shuffle(futuro.filter((c) => c.deeper), rand)
  return [...ordered, ...lighter, ...deeper].map((c) => c.id)
}

export function newSeed(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] >>> (32 - SEED_BITS)
}
