import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/floracao/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // usamos public/manifest.json diretamente
      includeAssets: ['favicon.svg', 'icons/*.png'],
      workbox: {
        // As fotos das flores ficam fora do precache de propósito (senão a
        // instalação da app passava de 400 KB para 1,5 MB). Em vez disso
        // guardam-se à medida que aparecem: o Heitor faz rotas com cobertura
        // fraca, e sem isto o catálogo voltava a puxar imagens em dados móveis.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/flores/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fotos-flores',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
