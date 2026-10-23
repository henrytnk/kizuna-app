import { expect, test } from '@playwright/test'

test('a full game plays end to end on a phone', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await page.getByLabel('Nome do jogador 1').fill('Ana')
  await page.getByLabel('Nome do jogador 2').fill('Leo')
  await page.getByRole('button', { name: 'Começar' }).click()

  await expect(page.getByRole('heading', { name: 'Rodada 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Começar' }).click()
  await expect(page.getByText('Vez de Ana')).toBeVisible()

  // Table mode turns the card to Leo after Ana answers, and survives a reload.
  await page.getByRole('button', { name: /Modo mesa/ }).click()
  await page.getByRole('button', { name: 'Respondi' }).click()
  await expect(page.getByText('Agora é a vez de Leo')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Agora é a vez de Leo')).toBeVisible()
  await expect(page.getByRole('button', { name: /Modo mesa/ })).toHaveAttribute('aria-pressed', 'true')

  // Pass one card, then answer everything else.
  await page.getByRole('button', { name: 'Passar' }).click()
  const skip = page.getByRole('button', { name: 'Pular' })
  for (let i = 0; i < 100 && !(await skip.isVisible()); i++) {
    const start = page.getByRole('button', { name: 'Começar' })
    await (await start.isVisible() ? start : page.getByRole('button', { name: 'Respondi' })).click()
  }

  await page.getByRole('button', { name: 'Pular' }).click()
  await expect(page.getByRole('heading', { name: 'Vocês responderam 28 de 29 cartas' })).toBeVisible()
})

test('loads offline after the first visit', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Kizuna' })).toBeVisible()
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await expect(page.getByRole('heading', { name: 'Novo jogo' })).toBeVisible()
})
