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
        midnight: {
          950: '#07080D',
          900: '#0B0D14',
          850: '#111522',
          800: '#161B2C',
          750: '#1D243B',
          700: '#252F4C',
          600: '#38466E',
          500: '#526396',
          400: '#8192C2',
          300: '#B4C1E4',
          200: '#E0E7FA',
        },
        palimn: {
          cyan: '#38BDF8',
          'cyan-glow': 'rgba(56, 189, 248, 0.15)',
          violet: '#818CF8',
          'violet-deep': '#6366F1',
          amber: '#F59E0B',
          'amber-glow': 'rgba(245, 158, 11, 0.15)',
          emerald: '#10B981',
          'emerald-glow': 'rgba(16, 185, 129, 0.15)',
          slate: '#64748B',
          text: '#F4F7FB',
          muted: '#9AA4B2',
          dim: '#556075',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 24px -4px rgba(56, 189, 248, 0.3)',
        'glow-violet': '0 0 24px -4px rgba(129, 140, 248, 0.3)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.3)',
        'glass-subtle': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'breathe-slow': 'breathe 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSlow 4s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.03)', opacity: '1' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
