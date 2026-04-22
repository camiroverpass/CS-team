/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        roverpass: {
          DEFAULT: "#E5484D",
          50:  "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#E5484D",
          600: "#D73A3F",
          700: "#B82A2F",
          800: "#8F1F23",
          900: "#6B1518",
        },
      },
    },
  },
  plugins: [],
};
