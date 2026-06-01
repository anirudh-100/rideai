/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  // Use class-based dark mode so the app can force dark via StyleSheet.setFlag
  // (matches userInterfaceStyle: "dark" in app.json).
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Layered dark backgrounds (deepest → highest elevation)
        background: '#0A0A14',          // app shell
        surface: '#13131F',              // raised surfaces (tabbar, sticky bar)
        'surface-2': '#1C1C2B',          // elevated cards
        card: 'rgba(255,255,255,0.04)',  // glass card over background
        'card-strong': 'rgba(255,255,255,0.08)', // hovered/selected card
        // Accents
        primary: '#7C7BFF',              // softened indigo
        'primary-deep': '#5B5BE0',
        accent: '#E0B66B',               // warm gold for premium touches
        best: '#22C55E',                 // success green
        'best-soft': 'rgba(34,197,94,0.12)',
        // Text
        muted: '#9CA3AF',
        'muted-2': '#6B7280',
        // Borders
        hairline: 'rgba(255,255,255,0.08)',
        'hairline-strong': 'rgba(255,255,255,0.16)',
      },
    },
  },
  plugins: [],
};
