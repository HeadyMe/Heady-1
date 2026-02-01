/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
        colors: {
            primary: '#007AFF',
            secondary: '#5856D6',
            background: '#F2F2F7',
            card: '#FFFFFF',
            text: '#000000',
            border: '#C7C7CC',
            notification: '#FF3B30',
        }
    },
  },
  plugins: [],
}
