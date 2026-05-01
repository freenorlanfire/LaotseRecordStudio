/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Oro real — más intenso, mostaza profundo
        gold: {
          DEFAULT: '#C8960C',
          50:  '#FFF8E1',
          100: '#FAEAB0',
          200: '#F0CD60',
          300: '#E8B800',
          400: '#D4A00A',
          500: '#C8960C',
          600: '#A87A08',
          700: '#8A6006',
          800: '#6B4804',
          900: '#4D3202',
        },
        studio: {
          black:  '#000000',
          dark:   '#080808',
          card:   '#0E0E0E',
          border: '#1C1C1C',
          muted:  '#252525',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body:    ['Inter', 'sans-serif'],
        script:  ['Dancing Script', 'cursive'],
      },
      backgroundImage: {
        // Gradiente oro más intenso / saturado
        'gold-gradient':  'linear-gradient(135deg, #C8960C 0%, #F0CD60 45%, #A87A08 100%)',
        'gold-shimmer':   'linear-gradient(90deg, #A87A08 0%, #F0CD60 40%, #E8B800 60%, #A87A08 100%)',
        'dark-gradient':  'linear-gradient(180deg, #000000 0%, #080808 100%)',
        'hero-radial':    'radial-gradient(ellipse at center, rgba(200,150,12,0.07) 0%, transparent 70%)',
      },
      animation: {
        'shimmer':    'shimmer 2.5s linear infinite',
        'pulse-gold': 'pulseGold 2.5s ease-in-out infinite',
        'slide-up':   'slideUp 0.4s ease-out',
        'fade-in':    'fadeIn 0.6s ease-out',
        'waveform':   'waveform 1s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(200,150,12,0)' },
          '50%':      { boxShadow: '0 0 24px 6px rgba(200,150,12,0.35)' },
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
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%':      { transform: 'scaleY(1.0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
}
