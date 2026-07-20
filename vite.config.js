import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'NEETflix',
        short_name: 'NEETflix',
        description: 'Nonton Anime, Film, dan Baca Komik',
        theme_color: '#191826',
        background_color: '#191826',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logon2.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logon2.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  server: {
    proxy: {
      '/api/trakteer': {
        target: 'https://api.trakteer.id/v1/public',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trakteer/, ''),
      },
    },
  },
})
