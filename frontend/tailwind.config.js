/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#050505',
          subtle: '#080808',
          elevated: '#0D0D0D',
        },
        glass: {
          surface: 'rgba(255, 255, 255, 0.035)',
          elevated: 'rgba(255, 255, 255, 0.055)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-focus': 'rgba(201, 162, 39, 0.4)',
        },
        gold: {
          DEFAULT: '#C9A227',
          bright: '#E0B83F',
          deep: '#8F7417',
          subtle: 'rgba(201, 162, 39, 0.12)',
        },
        ink: {
          primary: '#F5F5F5',
          secondary: '#A1A1A1',
          muted: '#666666',
        },
        state: {
          success: '#4CAF7A',
          critical: '#D64545',
          warning: '#C9A227',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    }
  },
  plugins: []
};
