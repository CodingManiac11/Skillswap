module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      colors: {
        credBlack: '#18181a',
        credGray: '#232326',
        credAccent: '#2ed573',
        credWhite: '#f7f7fa',
      },
      fontFamily: {
        display: ['Poppins', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
