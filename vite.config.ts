import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
    watch: {
      // polling is more reliable across the Docker bind-mount boundary
      usePolling: true,
      interval: 300,
    },
  },
})
