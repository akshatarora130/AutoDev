/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "accent-primary": "var(--accent-primary)",
        "accent-primary-hover": "var(--accent-primary-hover)",
        "accent-secondary": "var(--accent-secondary)",
        "accent-link": "var(--accent-link)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
      },
    },
  },
  plugins: [],
};
