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
        graphite: {
          950: '#07090E',
          900: '#0B0D13',
          850: '#11141E',
          800: '#161B28',
          750: '#1D2334',
          700: '#252D42',
          600: '#343E5C',
          500: '#4F5D86',
          400: '#8493B8',
          300: '#B2BEDA',
          200: '#E2E8F0',
        },
        palimn: {
          violet: '#8B5CF6',
          'violet-light': '#A78BFA',
          'violet-dark': '#6D28D9',
          indigo: '#6366F1',
          cyan: '#38BDF8',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-violet': '0 0 20px -5px rgba(139, 92, 246, 0.25)',
        'glow-cyan': '0 0 20px -5px rgba(56, 189, 248, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
