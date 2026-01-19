import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/shaman-horoscope/',
  build: {
    outDir: 'docs'  
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Шаманский Гороскоп',
        short_name: 'ШаманГороскоп',
        description: 'Древняя мудрость животных, стихий и луны',
        theme_color: '#1a1a2e',
        background_color: '#0f3460',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/shaman-horoscope/', // Добавьте это!
        start_url: '/shaman-horoscope/',
        icons: [
          {
            src: '/shaman-horoscope/pwa-192x192.png', // Добавьте префикс!
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/shaman-horoscope/pwa-512x512.png', // Добавьте префикс!
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
