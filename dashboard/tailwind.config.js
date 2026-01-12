/** @type {import('tailwindcss').Config} */
const path = require('path');

module.exports = {
  content: [
    path.join(__dirname, 'src/**/*.html'),
    path.join(__dirname, 'src/**/*.ts'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
