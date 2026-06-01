import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F0F1A',
        surface: '#1A1A2E',
        primary: '#6366F1',
        card: 'rgba(255,255,255,0.05)',
        best: '#22C55E',
        muted: '#9CA3AF',
      },
    },
  },
  plugins: [],
};

export default config;
