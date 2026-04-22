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
      backgroundSize: {
        "size-200": "200% 100%",
      },
      keyframes: {
        "pro-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(255, 60, 130, 0.45), 0 0 0 0 rgba(161, 231, 238, 0.0)",
          },
          "50%": {
            boxShadow:
              "0 0 0 6px rgba(255, 60, 130, 0), 0 0 0 3px rgba(161, 231, 238, 0.35)",
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
