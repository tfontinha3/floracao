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
    }),
  ],
})
