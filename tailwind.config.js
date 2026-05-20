/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fffdf0',
          100: '#fff8cc',
          400: '#FFBF00',
          500: '#FFBF00',
          600: '#e6ac00',
          900: '#7a5b00',
        },
        surface: {
          DEFAULT: '#fffdf5',
          card:    '#ffffff',
          elevated:'#fffbeb',
          border:  '#e2e8f0',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      screens: { xs: '390px' },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease-out both',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) both',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
