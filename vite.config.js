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
        orientation: 'any',
        id: '/',
        start_url: '/',
        scope: '/',
        categories: ['entertainment', 'movies'],
        dir: 'ltr',
        shortcuts: [
          {
            name: 'Beranda Anime',
            short_name: 'Beranda',
            description: 'Buka halaman utama',
            url: '/home',
            icons: [{ src: '/logon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Cari Anime',
            short_name: 'Cari Anime',
            description: 'Cari judul anime',
            url: '/search',
            icons: [{ src: '/logon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Nonton Film',
            short_name: 'Film',
            description: 'Buka halaman Film',
            url: '/film',
            icons: [{ src: '/logon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Baca Komik',
            short_name: 'Komik',
            description: 'Buka halaman Komik',
            url: '/comic',
            icons: [{ src: '/logon-192.png', sizes: '192x192' }]
          }
        ],
        icons: [
          {
            src: '/logon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: '/homepage2.webp',
            sizes: '1920x1080',
            type: 'image/webp',
            form_factor: 'wide'
          },
          {
            src: '/watchpage2.webp',
            sizes: '1920x1080',
            type: 'image/webp',
            form_factor: 'wide'
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
