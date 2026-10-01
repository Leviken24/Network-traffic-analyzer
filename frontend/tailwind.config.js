/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#06070D',
          surface: '#0B0D16',
          card: '#0F1220',
          elevated: '#14182A',
          border: '#242943',
        },
        indigo: {
          DEFAULT: '#6366F1',
          primary: '#6366F1',
          bright: '#818CF8',
        },
        blue: {
          secondary: '#3B82F6',
        },
        cyan: {
          accent: '#06B6D4',
        },
        content: {
          primary: '#F8FAFC',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          critical: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    }
  },
  plugins: []
};
