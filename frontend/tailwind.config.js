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
        peat: {
          950: '#090a0f',
          900: '#12141d',
          800: '#1c202d',
          700: '#2a3144',
          accent: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          critical: '#dc2626'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
