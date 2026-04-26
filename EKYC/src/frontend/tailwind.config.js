/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: '#0066cc', dark: '#004fa3', light: '#e6f0ff' },
      },
    },
  },
  plugins: [],
};
