/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
   "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        accent: "#483bff",
        "accent-bg": "purple-400",
        "accent-hover": "rgba(255, 170, 59, 0.1)",
        "accent-color": "rgba(170, 255, 59, 0.5)",
        clifford: "#da373d",
      },
    },
  },
  plugins: [],
};