import { describe, expect, it } from 'vitest'
import { CARDS, getCard } from './cards'
import { buildDeck, hasThemeRun, mulberry32, newSeed } from './deck'
import { render } from './render'
import type { Order, Player } from './types'

const SEEDS = Array.from({ length: 10_000 }, (_, i) => Math.floor(mulberry32(i + 1)() * 2 ** 20))
const SETTINGS: { order: Order }[] = [{ order: 'by-round' }, { order: 'random' }]
const SIZE = 48

describe('cards.json', () => {
  it('has 15 + 17 + 16 cards with unique ids', () => {
    const count = (r: number) => CARDS.filter((c) => c.round === r).length
    expect([count(1), count(2), count(3)]).toEqual([15, 17, 16])
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length)
  })

  it('has one taking-turns card, the five qualities, with no per-player wording', () => {
    const together = CARDS.filter((c) => c.together)
    expect(together.map((c) => c.id)).toEqual(['pr-18'])
    expect(together[0].text + together[0].followUp).not.toMatch(/[{}]/)
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

  it('deals rounds in order 1 → 2 → 3 in by-round mode', () => {
    for (const seed of SEEDS.slice(0, 2000)) {
      const rounds = buildDeck(CARDS, { seed, order: 'by-round' }).map((id) => getCard(id).round)
      expect(rounds).toEqual([...rounds].sort((x, y) => x - y))
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
      const mixed = buildDeck(CARDS, { seed, order: 'random' }).map(getCard)
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
