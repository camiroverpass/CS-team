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
        brand: {
          coral: "#F06060",
          coralSoft: "#FEE2E2",
          navy: "#1E2F3D",
          navySoft: "#E2E8F0",
          green: "#2EB568",
          greenSoft: "#DCFCE7",
          orange: "#F5A623",
          orangeSoft: "#FEF3C7",
          red: "#D94848",
          pink: "#F7B5B5",
        },
        surface: "#F5F6F8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
