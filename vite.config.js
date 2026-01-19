import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig({
  base: '/shaman-horoscope/',               
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
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
   build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})

