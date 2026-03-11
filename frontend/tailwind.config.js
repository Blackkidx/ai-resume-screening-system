/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
        thai: ['Noto Sans Thai', 'sans-serif'],
      },
      colors: {
        // White Minimalist Theme Tokens
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7', // Primary CTA
          700: '#0369a1', // Hover CTA
          900: '#0c4a6e',
        },
        slate: {
          50: '#f8fafc',  // Main Background
          200: '#e2e8f0', // Borders
          400: '#94a3b8', // Muted Text/Hints
          600: '#475569', // Secondary Text
          900: '#0f172a', // Primary Text/Headings
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 4px 14px 0 rgba(14, 165, 233, 0.39)',
      }
    },
  },
  plugins: [],
}
