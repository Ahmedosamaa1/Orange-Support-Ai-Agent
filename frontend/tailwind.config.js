/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF8F0',
          100: '#FFEBD6',
          200: '#FFD3A8',
          300: '#FFB675',
          400: '#FF9742',
          500: '#FF7900', // Signature Orange Telecom
          600: '#E06000',
          700: '#BA4C00',
          800: '#943A00',
          900: '#752D00',
        },
        telecom: {
          black: '#121212',
          cardDark: '#1E1E24',
          borderDark: '#2D2D38',
          grayText: '#8A8A93'
        }
      },
      fontFamily: {
        sans: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif']
      }
    },
  },
  plugins: [],
}
