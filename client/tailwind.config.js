/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f0fa",
          100: "#e8ddf3",
          200: "#d4bfe8",
          300: "#b893d8",
          400: "#9b66c4",
          500: "#7b3fa8",
          600: "#6b2d8b",
          700: "#5b2575",
          800: "#4a1f5f",
          900: "#3d1a4f",
        },
      },
    },
  },
  plugins: [],
};
