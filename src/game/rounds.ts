import type { Card, Theme } from './types'

/** `minutes` is the suggested length shown by the round timer bar: about 15 per round. */
export const SEGMENTS: Record<string, { title: string; subtitle: string; howTo: string; minutes: number }> = {
  '1': {
    title: 'Rodada 1',
    subtitle: 'para aquecer',
    howTo: 'Perguntas leves para começar. Os dois respondem toda carta, revezando quem começa, e qualquer um pode passar.',
    minutes: 15,
  },
  '2': {
    title: 'Rodada 2',
    subtitle: 'mais pessoal',
    howTo: 'Um pouco mais fundo. Depois de cada resposta, façam um ou dois follow-ups antes de passar a vez.',
    minutes: 15,
  },
  '3': {
    title: 'Rodada 3',
    subtitle: 'mais profunda',
    howTo: 'A rodada mais íntima, e sobre vocês dois. Escutem para entender, sem pressa de responder.',
    minutes: 15,
  },
  mix: {
    title: 'Cartas misturadas',
    subtitle: 'todas as rodadas',
    howTo: 'Das leves às mais profundas, em qualquer ordem. Os dois respondem toda carta, e qualquer um pode passar.',
    minutes: 45,
  },
  bonus: {
    title: 'Carta bônus',
    subtitle: 'família',
    howTo: 'Uma pergunta extra, sobre a vida que cada um imagina.',
    minutes: 5,
  },
}

export const THEME_LABEL: Record<Theme, string> = {
  passado: 'Passado',
  presente: 'Presente',
  futuro: 'Futuro',
}

export function roundLabel(card: Card): string {
  return card.round === 'bonus' ? 'Bônus' : `Rodada ${card.round}`
}
