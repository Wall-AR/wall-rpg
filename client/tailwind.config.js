/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#e94560', light: '#ff6b81' },
        secondary: { DEFAULT: '#0f3460', light: '#16213e' },
        dark: '#1a1a2e',
        light: '#eee',
      },
    },
  },
  plugins: [],
};
