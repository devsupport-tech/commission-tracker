/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1e1e2d',
          light: '#2d2d3a',
          accent: '#7c3aed',
        },
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f97316',
      },
    },
  },
  plugins: [],
}
