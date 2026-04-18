/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        button: "10px",
        card: "12px",
        input: "12px",
      },
      colors: {
        // SoundAI brand tokens (strict)
        primary: "#FF3C82",
        "primary-soft": "#FF98A8",
        text: "#1D1D1D",
        dark: "#151414",
        surface: "#EFF3F6",
        "surface-muted": "#F8F9FB",
        "accent-light": "#A1E7EE",
        // Legacy aliases for the existing marketing site
        "accent-pink": "#FF3C82",
        "accent-pink-light": "#FF98A8",
        "accent-cyan": "#A1E7EE",
        "dark-bg": "#1D1D1D",
        "dark-deeper": "#151414",
        "light-bg": "#EFF3F6",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        codec: ['"Codec Pro"', "Inter", "sans-serif"],
      },
      boxShadow: {
        "flat-sm": "0 1px 2px 0 rgba(21, 20, 20, 0.04)",
        flat: "0 1px 2px 0 rgba(21, 20, 20, 0.04), 0 1px 3px 0 rgba(21, 20, 20, 0.03)",
      },
    },
  },
  plugins: [import("tailwindcss-animate")],
};
