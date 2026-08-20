/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fef1f4',
          100: '#fde2e8',
          200: '#fbc9d6',
          300: '#f89db7',
          400: '#f36892',
          500: '#E50141',
          600: '#d11541',
          700: '#b01038',
          800: '#930f35',
          900: '#7d0f31',
        },
      },
    },
  },
  plugins: [],
};
