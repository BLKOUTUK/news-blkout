/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'liberation': {
          'black-power': '#000000',
          'gold-divine': '#FFD700',
          'sovereignty-gold': '#D4AF37',
          'pride-purple': '#9B4DCA',
          'community-teal': '#00CED1',
          'resistance-red': '#DC143C',
          'healing-green': '#2E8B57',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
