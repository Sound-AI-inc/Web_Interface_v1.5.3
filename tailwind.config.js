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
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-soft": "rgb(var(--color-primary-soft) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        dark: "#151414",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        "accent-light": "rgb(var(--color-accent-light) / <alpha-value>)",
        // Legacy aliases for the existing marketing site
        "accent-pink": "rgb(var(--color-primary) / <alpha-value>)",
        "accent-pink-light": "rgb(var(--color-primary-soft) / <alpha-value>)",
        "accent-cyan": "rgb(var(--color-accent-light) / <alpha-value>)",
        "dark-bg": "rgb(var(--color-text) / <alpha-value>)",
        "dark-deeper": "#151414",
        "light-bg": "rgb(var(--color-surface) / <alpha-value>)",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        codec: ['"Codec Pro"', "Inter", "sans-serif"],
      },
      boxShadow: {
        "flat-sm": "0 1px 2px 0 rgba(21, 20, 20, 0.04)",
        flat: "0 1px 2px 0 rgba(21, 20, 20, 0.04), 0 1px 3px 0 rgba(21, 20, 20, 0.03)",
      },
      backgroundSize: {
        "size-200": "200% 100%",
      },
      keyframes: {
        "pro-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(var(--color-primary-rgb), 0.28), 0 0 0 0 rgba(var(--color-primary-soft-rgb), 0.0)",
          },
          "50%": {
            boxShadow:
              "0 0 0 6px rgba(var(--color-primary-rgb), 0), 0 0 0 3px rgba(var(--color-primary-soft-rgb), 0.22)",
          },
        },
        "pro-shimmer": {
          "0%": { backgroundPosition: "200% 50%" },
          "100%": { backgroundPosition: "-200% 50%" },
        },
        "pro-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.35)", opacity: "1" },
        },
      },
      animation: {
        "pro-pulse": "pro-pulse 2.2s ease-in-out infinite",
        "pro-shimmer": "pro-shimmer 3.5s linear infinite",
        "pro-dot": "pro-dot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [import("tailwindcss-animate")],
};
