/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
  "./components/**/*.{js,ts,jsx,tsx}",
  "./pages/**/*.{js,ts,jsx,tsx}",
  "./app/**/*.{js,ts,jsx,tsx}",
],

  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
       fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};


