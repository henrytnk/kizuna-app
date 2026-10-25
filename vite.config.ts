import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** The site-wide headers from public/_headers (Netlify's format), so `vite preview` serves the same ones. */
function netlifyHeaders(): Record<string, string> {
  const lines = readFileSync(new URL('./public/_headers', import.meta.url), 'utf8').split('\n')
  return Object.fromEntries(
    lines
      .filter((l) => /^\s+[\w-]+:/.test(l))
      .map((l) => {
        const i = l.indexOf(':')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      }),
  )
}

// https://vite.dev/config/
export default defineConfig({
  preview: { headers: netlifyHeaders() },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Kizuna Quiz',
        short_name: 'Kizuna Quiz',
        description: 'Perguntas para criar conexão: um jogo de cartas para casais.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0d1224',
        background_color: '#0d1224',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
      },
    }),
  ],
})
