/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nexabg: "#0b0f1e",
        nexabase: "#141d35",
        nexacard: "rgba(18, 31, 58, 0.58)",
      },
      boxShadow: {
        glow: "0 0 35px rgba(120, 90, 255, 0.35)",
      },
    },
  },
  plugins: [],
};
