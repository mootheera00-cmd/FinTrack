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
          50:  '#f0fdf4',
          100: '#dcfce7',
          400: '#16a34a',
          500: '#15803d',
          600: '#166534',
          900: '#14532d',
        },
        surface: {
          DEFAULT: '#f0f4ff',
          card:    '#ffffff',
          elevated:'#f5f7ff',
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
