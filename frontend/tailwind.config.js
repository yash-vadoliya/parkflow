/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#1e293b",
        success: "#16a34a",
        danger: "#dc2626",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};