/** @type {import('tailwindcss').Config} */
const { sacredTokens } = require('./dist/theme/tokens'); // Assuming build output

module.exports = {
  theme: {
    extend: {
      colors: {
        sacred: sacredTokens.colors
      },
      animation: sacredTokens.animations,
      keyframes: sacredTokens.keyframes
    }
  },
  plugins: [],
};
