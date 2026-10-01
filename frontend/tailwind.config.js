/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F6F9',
          100: '#D9E8F0',
          200: '#B0CFE0',
          500: '#1E5A7D',
          600: '#164967',
          700: '#0F3D56', // Primary Navy
          800: '#0A2B3D',
          900: '#061D2A',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0EA5A8', // Secondary Teal
          700: '#0F766E',
          800: '#115E59',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B', // Accent Amber
          600: '#D97706', // Warning
          700: '#B45309',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        app: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#172033',
          muted: '#64748B',
          subtle: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    }
  },
  plugins: []
};
