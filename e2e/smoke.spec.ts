import { expect, test } from '@playwright/test'

test('a full game plays end to end on a phone', async ({ page }) => {
  // With table mode on, every turn would wait for the 180° turn; reduced motion skips it (and is worth covering).
  await page.emulateMedia({ reducedMotion: 'reduce' })
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
  await expect(page.getByText('Vez de Leo')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Vez de Leo')).toBeVisible()
  await expect(page.getByRole('button', { name: /Modo mesa/ })).toHaveAttribute('aria-pressed', 'true')

  // Pass one card, then answer everything else.
  await page.getByRole('button', { name: 'Passar' }).click()
  const skip = page.getByRole('button', { name: 'Pular' })
  for (let i = 0; i < 200 && !(await skip.isVisible()); i++) {
    const start = page.getByRole('button', { name: 'Começar' })
    await (await start.isVisible() ? start : page.getByRole('button', { name: 'Respondi' })).click()
  }

  await page.getByRole('button', { name: 'Pular' }).click()
  await expect(page.getByRole('heading', { name: 'Vocês responderam 49 de 50 cartas' })).toBeVisible()
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

test('two phones using the same code deal the same sequence', async ({ browser, page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await page.getByLabel('Nome do jogador 1').fill('Ana')
  await page.getByLabel('Nome do jogador 2').fill('Leo')
  await page.getByRole('radio', { name: 'Aleatória' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByRole('button', { name: 'Jogar em dois celulares' }).click()
  const code = (await page.getByRole('dialog').locator('p.font-mono').textContent())!.trim()
  expect(code).toMatch(/^[0-9A-Z]{4}$/)
  await page.getByRole('button', { name: 'Fechar' }).click()

  // One phone joins by link (settings come with it), another by typing the code.
  const viaLink = await (await browser.newContext()).newPage()
  await viaLink.goto(`/#g=${code}&o=a`)
  await expect(viaLink.getByRole('heading', { name: 'Entrar no jogo' })).toBeVisible()
  await expect(viaLink.getByLabel('Código do jogo')).toHaveValue(code)
  await expect(viaLink).toHaveURL(/\/$/)

  const viaCode = await (await browser.newContext()).newPage()
  await viaCode.goto('/')
  await viaCode.getByRole('button', { name: 'Entrar com código' }).click()
  await viaCode.getByLabel('Código do jogo').fill(code.toLowerCase())
  await viaCode.getByRole('radio', { name: 'Aleatória' }).click()

  for (const p of [viaLink, viaCode]) {
    await p.getByLabel('Nome do jogador 1').fill('Ana')
    await p.getByLabel('Nome do jogador 2').fill('Leo')
    await p.getByRole('button', { name: 'Começar' }).click()
  }

  const phones = [page, viaLink, viaCode]
  for (const p of phones) await p.getByRole('button', { name: 'Começar' }).click()
  for (let i = 0; i < 5; i++) {
    const texts = await Promise.all(phones.map((p) => p.locator('article h2').textContent()))
    expect(new Set(texts).size).toBe(1)
    for (const p of phones) {
      await p.getByRole('button', { name: 'Respondi' }).click()
      await p.getByRole('button', { name: 'Respondi' }).click()
    }
  }
})

test('rejects a mistyped code', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar com código' }).click()
  await page.getByLabel('Código do jogo').fill('K7Q')
  await page.getByRole('button', { name: 'Começar' }).click()
  await expect(page.getByText('Esse código não parece certo')).toBeVisible()
  await expect(page.getByLabel('Código do jogo')).toHaveAttribute('aria-invalid', 'true')
})

test('nothing covers the bottom buttons, and the page runs under its security policy', async ({ page }) => {
  const violations: string[] = []
  page.on('console', (m) => {
    if (/Content Security Policy/i.test(m.text())) violations.push(`${m.location().url} ${m.text()}`)
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  // Give injected widgets (such as a host's badge) time to appear.
  await page.waitForTimeout(2000)

  for (const name of ['Respondi', 'Passar']) {
    const button = page.getByRole('button', { name })
    const box = (await button.boundingBox())!
    // Check near the corners too (inside the rounding): a badge pinned bottom-right would only cover part of the button.
    for (const [x, y] of [
      [box.x + box.width / 2, box.y + box.height / 2],
      [box.x + box.width - 16, box.y + box.height - 12],
      [box.x + 16, box.y + box.height - 12],
    ]) {
      const onTop = await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest('button')?.textContent, [x, y])
      expect(onTop, `${name} at (${Math.round(x)}, ${Math.round(y)})`).toBe(name)
    }
  }
  const csp = (await page.request.get('/')).headers()['content-security-policy']
  expect(csp).toContain("script-src 'self'")
  // The app itself must not trip its own policy. Netlify's badge does, from its injected script or its
  // srcdoc iframe: that is the point.
  expect(violations.filter((v) => !/^(about:srcdoc|\S*\/\.netlify\/)/.test(v))).toEqual([])
})

test('the five-qualities card has both players take turns within the card', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await page.getByLabel('Nome do jogador 1').fill('Ana')
  await page.getByLabel('Nome do jogador 2').fill('Leo')
  await page.getByRole('button', { name: 'Começar' }).click()

  // Pass cards until the taking-turns card comes up (it is in round 2).
  const label = page.getByText('Os dois, revezando')
  for (let i = 0; i < 40 && !(await label.isVisible()); i++) {
    const start = page.getByRole('button', { name: 'Começar' })
    await (await start.isVisible() ? start : page.getByRole('button', { name: 'Passar' })).click()
  }
  await expect(label).toBeVisible()
  const counter = page.getByRole('progressbar', { name: 'Qualidades ditas' })
  const card = await page.locator('article h2').textContent()
  const banner = page.locator('[aria-live]')
  const first = (await banner.textContent())!.replace('Vez de ', '')
  const second = first === 'Ana' ? 'Leo' : 'Ana'

  for (let turn = 0; turn < 10; turn++) {
    await expect(counter).toHaveAttribute('aria-valuenow', String(turn))
    await expect(banner).toHaveText(`Vez de ${turn % 2 === 0 ? first : second}`)
    await expect(page.locator('article h2')).toHaveText(card!)
    await page.getByRole('button', { name: 'Respondi' }).click()
  }
  // Next is another card, or the round 3 intro when this was round 2's last card.
  await expect(label).toHaveCount(0)
  await expect(page.getByRole('heading', { name: card!, exact: true })).toHaveCount(0)
})

test('cards come in the exact order of the list', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  const expected = [
    'Conte uma memória preciosa.',
    'Qual era o seu maior sonho quando era criança?',
    /^Quando foi a última vez que você cantou/,
    'Como eram os fins de semana na sua casa quando você era criança?',
    /^Diga três coisas que você e .+ parecem ter em comum\.$/,
    'Como seria um dia perfeito pra você?',
  ]
  for (const text of expected) {
    await expect(page.locator('article h2')).toHaveText(text)
    await page.getByRole('button', { name: 'Respondi' }).click()
    await page.getByRole('button', { name: 'Respondi' }).click()
  }
})
