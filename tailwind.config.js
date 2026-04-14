/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        white: 'rgb(var(--c-text-100) / <alpha-value>)',
        black: 'rgb(var(--c-bg-900) / <alpha-value>)',
        slate: {
          50:  'rgb(var(--c-text-100) / <alpha-value>)',
          100: 'rgb(var(--c-text-100) / <alpha-value>)',
          200: 'rgb(var(--c-text-200) / <alpha-value>)',
          300: 'rgb(var(--c-text-300) / <alpha-value>)',
          400: 'rgb(var(--c-text-400) / <alpha-value>)',
          500: 'rgb(var(--c-text-500) / <alpha-value>)',
          600: 'rgb(var(--c-bg-600) / <alpha-value>)',
          700: 'rgb(var(--c-bg-700) / <alpha-value>)',
          800: 'rgb(var(--c-bg-800) / <alpha-value>)',
          900: 'rgb(var(--c-bg-900) / <alpha-value>)',
          950: 'rgb(var(--c-bg-950) / <alpha-value>)',
        },
        blue: {
          50: 'rgb(var(--c-primary-50) / <alpha-value>)',
          100: 'rgb(var(--c-primary-100) / <alpha-value>)',
          200: 'rgb(var(--c-primary-200) / <alpha-value>)',
          300: 'rgb(var(--c-primary-300) / <alpha-value>)',
          400: 'rgb(var(--c-primary-400) / <alpha-value>)',
          500: 'rgb(var(--c-primary-500) / <alpha-value>)',
          600: 'rgb(var(--c-primary-600) / <alpha-value>)',
          700: 'rgb(var(--c-primary-700) / <alpha-value>)',
          800: 'rgb(var(--c-primary-800) / <alpha-value>)',
          900: 'rgb(var(--c-primary-900) / <alpha-value>)',
          950: 'rgb(var(--c-primary-950) / <alpha-value>)',
          foreground: 'rgb(var(--c-primary-foreground) / <alpha-value>)',
        },
        background: 'rgb(var(--c-bg-900) / <alpha-value>)',
        surface: 'rgb(var(--c-bg-800) / <alpha-value>)',
      }
    }
  },
  plugins: [],
}
