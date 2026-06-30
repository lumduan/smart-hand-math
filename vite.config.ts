import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const analyze = mode === 'analyze'
  return {
    plugins: [
      react(),
      // Installable + offline PWA. Model/wasm are runtime-cached (CacheFirst) on
      // first camera use, so the app works offline after the first visit.
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'models/hand_landmarker.task'],
        manifest: {
          name: 'SmartHand Math',
          short_name: 'SmartHand',
          description: 'Hands-free mental-math game for kids — answer by showing fingers to the camera.',
          theme_color: '#65c3c8',
          background_color: '#faf7f5',
          display: 'standalone',
          start_url: '/',
          icons: [
            // SVG icon (no PNG rasterizer in this env); PNG maskable icons are a
            // future polish — most browsers accept this for installability.
            { src: '/assets/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/models/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'mediapipe-assets',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
      // Bundle analyzer — only emitted with `vite build --mode analyze`.
      ...(analyze
        ? [visualizer({ filename: 'dist/stats.html', open: false, gzipSize: true, brotliSize: true })]
        : []),
    ],
    resolve: {
      alias: {
        // mirror the TypeScript "@/*" path alias
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true, // reachable inside the Docker dev container
      port: 5173,
      strictPort: true,
      // Vite 5.4+ blocks non-localhost Host headers by default (DNS-rebinding
      // guard). Allow the Cloudflare-proxied domains used to reach this dev
      // server over HTTPS. (localhost/127.0.0.1 always allowed.)
      allowedHosts: ['hand.candythink.com', 'handmath.org'],
      watch: {
        // polling is more reliable across the Docker bind-mount boundary
        usePolling: true,
        interval: 300,
      },
    },
    build: {
      chunkSizeWarningLimit: 700, // after splitting tasks-vision into its own chunk
      rollupOptions: {
        output: {
          // Split stable vendors from app code. NOTE: @mediapipe/tasks-vision is
          // intentionally NOT listed — it's auto-split by the dynamic import in
          // useHandTracker, so it loads only when the camera starts.
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
          },
        },
      },
    },
  }
})
