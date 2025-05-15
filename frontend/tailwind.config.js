/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4B83FB',
          DEFAULT: '#3B82F6', // FAIT blue
          dark: '#2563EB',
        },
        secondary: {
          light: '#FBBF24',
          DEFAULT: '#F59E0B', // FAIT gold/amber
          dark: '#D97706',
        },
        fait: {
          blue: '#3B82F6',
          gold: '#F59E0B',
        }
      },
    },
  },
  plugins: [],
}
