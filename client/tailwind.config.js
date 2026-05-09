/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          950: '#050508',
          900: '#0a0a10',
          800: '#111118',
          700: '#1a1a24',
          600: '#252532',
          500: '#3a3a4e',
        },
        cream: '#e8e6d9',
        muted: '#6b6970',
        accent: '#c0392b',
        'accent-dim': '#8b2020',
        gold: '#c9a84c',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'reveal': 'reveal 0.6s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'flicker': 'flicker 3s linear infinite',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'reveal': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'flicker': {
          '0%, 95%, 100%': { opacity: '1' },
          '96%': { opacity: '0.8' },
          '97%': { opacity: '1' },
          '98%': { opacity: '0.6' },
          '99%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
