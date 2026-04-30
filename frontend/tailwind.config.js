/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          50:  '#FAF5DC',
          100: '#F5EBB9',
          200: '#EDD773',
          300: '#E5C34D',
          400: '#D4AF37',
          500: '#B8962E',
          600: '#9C7D26',
          700: '#80641E',
          800: '#644B15',
          900: '#48330D',
        },
        studio: {
          black: '#000000',
          dark:  '#0A0A0A',
          card:  '#111111',
          border:'#1A1A1A',
          muted: '#2A2A2A',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body:    ['Inter', 'sans-serif'],
        script:  ['Dancing Script', 'cursive'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F5EBB9 50%, #B8962E 100%)',
        'dark-gradient': 'linear-gradient(180deg, #000000 0%, #0A0A0A 100%)',
        'hero-radial':   'radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)',
      },
      animation: {
        'shimmer':     'shimmer 2s linear infinite',
        'pulse-gold':  'pulseGold 2s ease-in-out infinite',
        'slide-up':    'slideUp 0.4s ease-out',
        'fade-in':     'fadeIn 0.6s ease-out',
        'waveform':    'waveform 1s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0)' },
          '50%':      { boxShadow: '0 0 20px 4px rgba(212,175,55,0.3)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%':      { transform: 'scaleY(1.0)' },
        },
      },
    },
  },
  plugins: [],
}
