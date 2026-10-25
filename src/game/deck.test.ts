import { describe, expect, it } from 'vitest'
import { CARDS, getCard } from './cards'
import { buildDeck, hasThemeRun, mulberry32, newSeed } from './deck'
import { render } from './render'
import type { Order, Player } from './types'

const SEEDS = Array.from({ length: 10_000 }, (_, i) => Math.floor(mulberry32(i + 1)() * 2 ** 20))
const SETTINGS: { order: Order }[] = [{ order: 'by-round' }, { order: 'random' }]
const SIZE = 48

describe('cards.json', () => {
  it('has 12 + 13 + 12 cards in rounds 1–3 and 11 in Nosso futuro, with unique ids', () => {
    const count = (r: number) => CARDS.filter((c) => c.round === r).length
    expect([count(1), count(2), count(3), count(4)]).toEqual([12, 13, 12, 11])
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length)
  })

  it('has one taking-turns card, the five qualities, with no per-player wording', () => {
    const together = CARDS.filter((c) => c.together)
    expect(together.map((c) => c.id)).toEqual(['pr-18'])
    expect(together[0].text + together[0].followUp).not.toMatch(/[{}]/)
  })
})

describe('round membership', () => {
  // The approved list. A card changes round only by changing this test on purpose.
  const APPROVED: Record<number, string[]> = {
    1: ['pa-01', 'pa-07', 'pa-08', 'pa-10', 'pr-06', 'pr-07', 'pr-10', 'pr-11', 'pr-12', 'fu-06', 'fu-07', 'fu-08'],
    2: ['pa-02', 'pa-04', 'pa-05', 'pa-11', 'pa-12', 'pr-02', 'pr-04', 'pr-08', 'pr-09', 'pr-13', 'pr-18', 'fu-01', 'fu-05'],
    3: ['pa-03', 'pa-06', 'pa-09', 'pa-13', 'pr-01', 'pr-03', 'pr-05', 'pr-14', 'fu-02', 'fu-03', 'fu-04', 'fu-11'],
    4: ['pa-14', 'pa-15', 'pr-15', 'pr-16', 'pr-17', 'fu-09', 'fu-10', 'fu-12', 'fu-13', 'fu-14', 'fu-15'],
  }

  it.each([1, 2, 3, 4])('round %i holds exactly the approved cards', (r) => {
    const ids = CARDS.filter((c) => c.round === r).map((c) => c.id)
    expect([...ids].sort()).toEqual([...APPROVED[r]].sort())
  })
})

describe('buildDeck', () => {
  it.each(SETTINGS)('contains every card exactly once for 10,000 seeds (%o)', (s) => {
    const expected = SIZE
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
    const a = buildDeck(CARDS, { seed: 1, order: 'random' })
    const b = buildDeck(CARDS, { seed: 2, order: 'random' })
    expect(a).not.toEqual(b)
  })

  it('deals rounds in order 1 → 2 → 3 → Nosso futuro in by-round mode', () => {
    for (const seed of SEEDS.slice(0, 2000)) {
      const rounds = buildDeck(CARDS, { seed, order: 'by-round' }).map((id) => getCard(id).round)
      expect(rounds).toEqual([...rounds].sort((x, y) => x - y))
    }
  })

  it.each(SETTINGS)('ends with Nosso futuro, lighter questions before deeper ones (%o)', (s) => {
    for (const seed of SEEDS.slice(0, 2000)) {
      const tail = buildDeck(CARDS, { seed, ...s }).slice(-11).map(getCard)
      expect(tail.every((c) => c.round === 4)).toBe(true)
      expect(tail.map((c) => (c.deeper ? 1 : 0))).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1])
    }
  })

  it('alternates themes within each round: never the same theme twice in a row', () => {
    for (const seed of SEEDS) {
      const deck = buildDeck(CARDS, { seed, order: 'by-round' }).map(getCard)
      for (const r of [1, 2, 3]) expect(hasThemeRun(deck.filter((c) => c.round === r), 2)).toBe(false)
    }
  })

  it('never deals one theme three times in a row in random order', () => {
    for (const seed of SEEDS) {
      const mixed = buildDeck(CARDS, { seed, order: 'random' }).map(getCard).filter((c) => c.round !== 4)
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
    expect(render(pr01.text, leo, ana)).toBe(
      'Conte o que você gosta em Ana. Seja bem sincero: diga coisas que você não diria pra alguém que acabou de conhecer.',
    )
    expect(render(pr01.text, ana, leo)).toBe(
      'Conte o que você gosta em Leo. Seja bem sincera: diga coisas que você não diria pra alguém que acabou de conhecer.',
    )
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
