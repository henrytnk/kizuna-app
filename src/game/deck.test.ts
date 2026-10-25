import { describe, expect, it } from 'vitest'
import { CARDS, getCard } from './cards'
import { buildDeck, hasThemeRun, mulberry32, newSeed } from './deck'
import { render } from './render'
import type { Order, Player } from './types'

const SEEDS = Array.from({ length: 10_000 }, (_, i) => Math.floor(mulberry32(i + 1)() * 2 ** 20))
const SETTINGS: { order: Order }[] = [{ order: 'listed' }, { order: 'random' }]
const SIZE = 48

describe('cards.json', () => {
  it('has 12 + 13 + 12 cards in rounds 1–3 and 11 in the final round, with unique ids', () => {
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

describe('deal order', () => {
  // The approved list, card by card: 1–12, 13–24 then the five qualities, 25–36, 37–41 then A–F.
  // Cards are dealt in exactly this order. Change it only on purpose, here and in cards.json.
  const APPROVED_ORDER = [
    'pa-01', 'pa-08', 'pa-07', 'pa-10', 'pr-06', 'pr-07', 'pr-10', 'pr-11', 'pr-12', 'fu-06', 'fu-07', 'fu-08',
    'pa-02', 'pa-04', 'pa-05', 'pa-11', 'pa-12', 'pr-02', 'pr-04', 'pr-08', 'pr-09', 'pr-13', 'fu-01', 'fu-05', 'pr-18',
    'pa-03', 'pa-06', 'pa-09', 'pa-13', 'pr-14', 'pr-01', 'pr-03', 'pr-05', 'fu-02', 'fu-03', 'fu-04', 'fu-11',
    'pr-15', 'fu-10', 'fu-12', 'fu-13', 'fu-09', 'pa-15', 'pa-14', 'pr-17', 'pr-16', 'fu-14', 'fu-15',
  ]

  it('deals the approved list exactly, for every seed', () => {
    for (const seed of SEEDS.slice(0, 1000)) expect(buildDeck(CARDS, { seed, order: 'listed' })).toEqual(APPROVED_ORDER)
  })

  it('starts with the memory card and ends with the children card', () => {
    const deck = buildDeck(CARDS, { seed: 1, order: 'listed' }).map(getCard)
    expect(deck[0].text).toBe('Qual é a sua memória mais preciosa?')
    expect(deck.at(-1)!.text).toBe('Você se imagina tendo filhos? Como você imagina ser {pai|mãe}?')
  })

  it('keeps the final round last, in list order, even in random order', () => {
    for (const seed of SEEDS.slice(0, 1000)) {
      expect(buildDeck(CARDS, { seed, order: 'random' }).slice(-11)).toEqual(APPROVED_ORDER.slice(-11))
    }
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
