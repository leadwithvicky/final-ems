/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#fef7f7',
          100: '#feebeb',
          200: '#fddcdc',
          300: '#fbb8b8',
          400: '#f78f8f',
          500: '#ff6b6b',
          600: '#ed4a4a',
          700: '#c83333',
          800: '#a62d2d',
          900: '#8a2e2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
