/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#3D81E3'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        geist: ['"Geist Sans"', 'Inter', 'sans-serif'],
      },
      animation: {
        shiny: 'shiny 6s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        shiny: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
