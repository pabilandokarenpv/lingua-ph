/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0A84FF',
          dark: '#0071E3',
          light: '#409CFF',
          glow: 'rgba(10, 132, 255, 0.25)',
        },
        surface: {
          0: '#000000',
          1: '#0D0D0F',
          2: '#1C1C1E',
          3: '#2C2C2E',
          4: '#3A3A3C',
        },
        success: '#30D158',
        warning: '#FFD60A',
        danger: '#FF453A',
        info: '#64D2FF',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
