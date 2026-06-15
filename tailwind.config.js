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
          50:  '#fafafa',
          100: '#f5f5f5',
          400: '#a3a3a3',
          500: '#525252',
          600: '#404040',
          900: '#171717',
        },
        surface: {
          DEFAULT: '#ffffff',
          card:    '#ffffff',
          elevated:'#fafafa',
          border:  '#e5e5e5',
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
        'scale-in':   'scaleIn 0.2s ease-out both',
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
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
