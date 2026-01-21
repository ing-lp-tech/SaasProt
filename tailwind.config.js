/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class', // Habilita dark mode con clase 'dark' en el elemento raíz
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        dark: "var(--color-dark)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        'theme': "var(--radius)", // Si decidimos hacer el radio dinámico también
      }
    },
  },
  plugins: [],
};
