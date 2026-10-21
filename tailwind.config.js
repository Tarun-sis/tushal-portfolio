/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07080a',
        surface: '#0d0f12',
        raised: '#13161a',
        line: 'rgba(255,255,255,0.09)',
        neon: { DEFAULT: '#C5FF00', soft: '#d8ff5c', dim: '#8fb800' },
        soft: '#f1f3ee',
        mute: '#9aa1a9',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
