/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1a56db', dark: '#1e429f' },
        success: '#057a55',
        danger: '#e02424',
        warning: '#c27803',
      }
    }
  },
  plugins: []
}
