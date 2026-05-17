/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Match web brand colors exactly
        brand: {
          green:  "#10b981", // emerald-500 — primary
          teal:   "#14b8a6", // teal-500
          dark:   "#059669", // emerald-600
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        inter:   ["Inter",   "sans-serif"],
      },
    },
  },
  plugins: [],
};
