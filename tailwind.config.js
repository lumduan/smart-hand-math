import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // "Baloo 2" loaded in index.html; falls back to rounded system fonts
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        pop: 'pop 0.35s ease-out',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    // Built-in pastel theme — see docs/plans/adr/ADR-0006-daisyui-cupcake-theme.md.
    // Light only.
    themes: ['cupcake'],
    darkTheme: false,
    logs: false,
  },
}
