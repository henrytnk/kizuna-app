import type { Card, Theme } from './types'

/** `minutes` is the suggested length shown by the round timer bar: about 20 per round of 15–17 cards. */
export const SEGMENTS: Record<string, { title: string; subtitle: string; howTo: string; minutes: number }> = {
  '1': {
    title: 'Rodada 1',
    subtitle: 'para aquecer',
    howTo: 'Perguntas leves para começar. Os dois respondem toda carta, revezando quem começa, e qualquer um pode passar.',
    minutes: 20,
  },
  '2': {
    title: 'Rodada 2',
    subtitle: 'mais pessoal',
    howTo: 'Um pouco mais fundo. Depois de cada resposta, façam um ou dois follow-ups antes de passar a vez.',
    minutes: 20,
  },
  '3': {
    title: 'Rodada 3',
    subtitle: 'mais profunda',
    howTo: 'A rodada mais íntima, e sobre vocês dois. Escutem para entender, sem pressa de responder.',
    minutes: 20,
  },
  mix: {
    title: 'Cartas misturadas',
    subtitle: 'todas as rodadas',
    howTo: 'Das leves às mais profundas, em qualquer ordem. Os dois respondem toda carta, e qualquer um pode passar.',
    minutes: 60,
  },
}

export const THEME_LABEL: Record<Theme, string> = {
  passado: 'Passado',
  presente: 'Presente',
  futuro: 'Futuro',
}

export function roundLabel(card: Card): string {
  return `Rodada ${card.round}`
}
