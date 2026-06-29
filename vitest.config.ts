import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Vitest config, kept SEPARATE from vite.config.ts so the Docker dev server's
// watch/host/strictPort settings never apply to a test run. Reuses the React
// plugin and the `@/` path alias that mirror tsconfig.app.json.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Coverage gate is scoped to the core engine, per the ROADMAP
      // "utils coverage gate met" Phase-2 exit criterion. Test files
      // themselves are excluded so the gate measures only the engine.
      include: ['src/utils/**'],
      exclude: ['src/utils/**/*.test.ts', 'src/test/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80,
      },
    },
  },
})
