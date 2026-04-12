/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			'accent-pink': '#ff3c82',
  			'accent-pink-light': '#ff98a8',
  			'accent-cyan': '#a1e7ee',
  			'dark-bg': '#1d1d1d',
  			'dark-deeper': '#151414',
  			'light-bg': '#eff3f6',
  		},
  		fontFamily: {
  			poppins: ['Poppins', 'sans-serif'],
  			codec: ['"Codec Pro"', 'Inter', 'sans-serif'],
  		},
  	}
  },
  plugins: [import("tailwindcss-animate")],
}

