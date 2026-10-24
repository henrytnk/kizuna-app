import { defineConfig, devices } from '@playwright/test'

// BASE_URL=https://kizuna-quiz.netlify.app npm run test:e2e runs the same tests against the live site.
const baseURL = process.env.BASE_URL ?? 'http://localhost:4173'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL, ...devices['Pixel 7'] },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run build && npx vite preview --port 4173 --strictPort',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
})
