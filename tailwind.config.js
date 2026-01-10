/**
 * News BLKOUT - Tailwind Configuration
 * Uses BLKOUT Liberation Design System
 */

/** @type {import('tailwindcss').Config} */
export default {
  presets: [require('./tailwind.preset')],

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      // App-specific extensions
    },
  },
  plugins: [],
}
