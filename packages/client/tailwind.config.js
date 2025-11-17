/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate"

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: 'true',
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
          '6': 'hsl(var(--chart-6))',
          '7': 'hsl(var(--chart-7))',
          '8': 'hsl(var(--chart-8))',
          '9': 'hsl(var(--chart-9))',
          '10': 'hsl(var(--chart-10))'
        },
        importance: {
          1: 'rgba(59, 130, 246, 0.05)',
          2: 'rgba(99, 102, 241, 0.08)', 
          3: 'rgba(234, 179, 8, 0.1)',
          4: 'rgba(249, 115, 22, 0.15)',
          5: 'rgba(239, 68, 68, 0.2)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
        },
        fontFamily: {
          sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
        },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        fadeIn: {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        },
        slideUp: {
          '0%': {
            transform: 'translateY(10px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        pulse: {
          '0%': {
            boxShadow: '0 0 0 0 rgb(16 185 129 / 0.4)'
          },
          '70%': {
            boxShadow: '0 0 0 6px rgb(16 185 129 / 0)'
          },
          '100%': {
            boxShadow: '0 0 0 0 rgb(16 185 129 / 0)'
          }
        },
        'gentle-glow': {
          '0%, 100%': { boxShadow: '0 0 15px var(--glow-color)' },
          '50%': { boxShadow: '0 0 25px var(--glow-color)' },
        },
        'pulse-green': {
          '0%, 100%': { 'background-color': 'rgb(34 197 94)' },
          '50%': { 'background-color': 'rgb(132 204 22)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gentle-glow': 'gentle-glow 2s infinite',
        'pulse-green': 'pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionProperty: {
        all: 'all'
      },
      transitionDuration: {
        '300': '300ms'
      },
      backdropBlur: {
        xl: '12px'
      },
      scale: {
        '97': '0.97',
      },
    }
  },
  plugins: [
    animate,
    function ({ addUtilities }) {
      addUtilities({
        '.transform-style-preserve-3d': {
          'transform-style': 'preserve-3d'
        },
        '.transform-perspective-800': {
          'transform': 'perspective(800px)'
        },
        '.rotate-15': {
          'transform': 'rotate(15deg)'
        }
      })
    }
  ]
}