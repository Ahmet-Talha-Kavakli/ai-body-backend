import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#0A0A0F',
          elevated: '#12121A',
          subtle: '#1A1A24',
        },
        ink: {
          DEFAULT: '#F5F5F7',
          muted: '#A1A1AA',
          subtle: '#71717A',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.14)',
        },
        accent: {
          DEFAULT: '#30D158',
          bright: '#5DE87E',
          deep: '#1FA844',
          glow: '#7FF09A',
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.5s ease-out both',
        'gradient-shift': 'gradientShift 12s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        gradientShift: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-2%,3%) scale(1.05)' },
        },
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, transparent, rgba(10,10,15,0.95)), radial-gradient(ellipse at top, rgba(139,92,246,0.15), transparent 50%)',
      },
    },
  },
  plugins: [],
}

export default config
