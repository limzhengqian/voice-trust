/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        tng: {
          blue: '#1A4FBE',
          'blue-deep': '#0E3A99',
          'blue-soft': '#3D6FE0',
          yellow: '#FFD500',
          'yellow-soft': '#FFF4C2',
          bg: '#F2F4F9',
          card: '#FFFFFF',
          text: '#0B1B3F',
          'text-muted': '#6B7693',
          line: '#E6EAF2',
          success: '#1FB36B',
          warn: '#F59E0B',
          danger: '#E0354B',
          purple: '#5B3FD9',
        },
      },
      fontFamily: {
        sora: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(15,30,80,0.06)',
        pop: '0 12px 40px rgba(15,30,80,0.18)',
      },
    },
  },
  plugins: [],
};
