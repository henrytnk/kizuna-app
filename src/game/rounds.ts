import type { Card, Theme } from './types'

export const SEGMENTS: Record<string, { title: string; subtitle: string; howTo: string }> = {
  '1': {
    title: 'Rodada 1',
    subtitle: 'para aquecer',
    howTo: 'Perguntas leves para começar. Os dois respondem cada carta, um de cada vez.',
  },
  '2': {
    title: 'Rodada 2',
    subtitle: 'mais pessoal',
    howTo: 'Agora as perguntas vão um pouco mais fundo. Sem pressa: deixem a conversa acontecer.',
  },
  '3': {
    title: 'Rodada 3',
    subtitle: 'mais profunda',
    howTo: 'As perguntas mais íntimas. Escutem com atenção e não interrompam quem está falando.',
  },
  mix: {
    title: 'Cartas misturadas',
    subtitle: 'todas as rodadas',
    howTo: 'As perguntas vêm em qualquer ordem, das leves às mais profundas. Os dois respondem cada carta.',
  },
  bonus: {
    title: 'Carta bônus',
    subtitle: 'família',
    howTo: 'Uma pergunta extra, sobre a vida que cada um imagina.',
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
