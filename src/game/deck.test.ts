import { describe, expect, it } from 'vitest'
import { CARDS, getCard } from './cards'
import { buildDeck, hasThemeRun, mulberry32, newSeed } from './deck'
import { render } from './render'
import type { Order, Player } from './types'

const SEEDS = Array.from({ length: 10_000 }, (_, i) => Math.floor(mulberry32(i + 1)() * 2 ** 20))
const SETTINGS: { order: Order; includeBonus: boolean }[] = [
  { order: 'by-round', includeBonus: false },
  { order: 'by-round', includeBonus: true },
  { order: 'random', includeBonus: false },
  { order: 'random', includeBonus: true },
]

describe('cards.json', () => {
  it('has 10 + 10 + 9 cards plus 1 bonus, with unique ids', () => {
    const count = (r: unknown) => CARDS.filter((c) => c.round === r).length
    expect([count(1), count(2), count(3), count('bonus')]).toEqual([10, 10, 9, 1])
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length)
  })
})

describe('buildDeck', () => {
  it.each(SETTINGS)('contains every card exactly once for 10,000 seeds (%o)', (s) => {
    const expected = s.includeBonus ? 30 : 29
    for (const seed of SEEDS) {
      const deck = buildDeck(CARDS, { seed, ...s })
      expect(deck.length).toBe(expected)
      expect(new Set(deck).size).toBe(expected)
    }
  })

  it.each(SETTINGS)('is deterministic for the same seed and settings (%o)', (s) => {
    for (const seed of SEEDS.slice(0, 500)) {
      expect(buildDeck(CARDS, { seed, ...s })).toEqual(buildDeck(CARDS, { seed, ...s }))
    }
  })

  it('differs between seeds', () => {
    const a = buildDeck(CARDS, { seed: 1, order: 'random', includeBonus: false })
    const b = buildDeck(CARDS, { seed: 2, order: 'random', includeBonus: false })
    expect(a).not.toEqual(b)
  })

  it('deals rounds in order 1 → 2 → 3 → bonus in by-round mode', () => {
    const rank = (r: unknown) => (r === 'bonus' ? 4 : (r as number))
    for (const seed of SEEDS.slice(0, 2000)) {
      const rounds = buildDeck(CARDS, { seed, order: 'by-round', includeBonus: true }).map((id) => rank(getCard(id).round))
      expect(rounds).toEqual([...rounds].sort((x, y) => x - y))
    }
  })

  it('keeps the bonus card last in random mode', () => {
    for (const seed of SEEDS.slice(0, 2000)) {
      expect(buildDeck(CARDS, { seed, order: 'random', includeBonus: true }).at(-1)).toBe('fu-10')
    }
  })

  it('alternates themes within each round: never the same theme twice in a row', () => {
    for (const seed of SEEDS) {
      const deck = buildDeck(CARDS, { seed, order: 'by-round', includeBonus: false }).map(getCard)
      for (const r of [1, 2, 3]) expect(hasThemeRun(deck.filter((c) => c.round === r), 2)).toBe(false)
    }
  })

  it('never deals one theme three times in a row in random order', () => {
    for (const seed of SEEDS) {
      const mixed = buildDeck(CARDS, { seed, order: 'random', includeBonus: false }).map(getCard)
      expect(hasThemeRun(mixed)).toBe(false)
    }
  })

  it('makes 20-bit seeds', () => {
    for (let i = 0; i < 1000; i++) {
      const s = newSeed()
      expect(Number.isInteger(s) && s >= 0 && s < 2 ** 20).toBe(true)
    }
  })
})

describe('render', () => {
  const ana: Player = { name: 'Ana', form: 'f' }
  const leo: Player = { name: 'Leo', form: 'm' }

  it('picks the answerer’s form and fills in the partner’s name', () => {
    const pr01 = getCard('pr-01')
    expect(render(pr01.text, leo, ana)).toBe('Conte o que você já gosta em Ana até agora. Seja específico.')
    expect(render(pr01.text, ana, leo)).toBe('Conte o que você já gosta em Leo até agora. Seja específica.')
  })

  it('leaves no braces in any card or follow-up, for either form', () => {
    for (const c of CARDS) {
      for (const [me, other] of [[ana, leo], [leo, ana], [ana, ana], [leo, leo]]) {
        expect(render(c.text, me, other)).not.toMatch(/[{}|]/)
        expect(render(c.followUp, me, other)).not.toMatch(/[{}|]/)
      }
    }
  })
})
