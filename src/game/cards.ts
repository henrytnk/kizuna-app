import cardsJson from '../data/cards.json'
import type { Card } from './types'

export const CARDS = cardsJson as Card[]

export const CARD_BY_ID: ReadonlyMap<string, Card> = new Map(CARDS.map((c) => [c.id, c]))

export function getCard(id: string): Card {
  const card = CARD_BY_ID.get(id)
  if (!card) throw new Error(`Unknown card id: ${id}`)
  return card
}
