/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F1117',
          800: '#0A0C12',
        },
        purple: {
          accent: '#8B5CF6',
          glow: '#6366F1',
        },
      },
    },
  },
  plugins: [],
}