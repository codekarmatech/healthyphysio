/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        'heading': ['"Playfair Display"', 'serif'],
        'display': ['Playfair Display', 'serif'],
      },
      colors: {
        // Deep Brand Colors (Logo)
        brand: {
          dark: '#0f172a', // Deep Blue/Slate
          blue: '#1e40af', // Primary Blue
          orange: '#ea580c', // Primary Orange
        },
        // Pastel Theme Palette
        pastel: {
          blue: '#e0f2fe', // Sky 100
          orange: '#ffedd5', // Orange 100
          purple: '#f3e8ff', // Purple 100
          teal: '#ccfbf1', // Teal 100
          cream: '#fdfbf7', // Warm Cream
          gray: '#f8fafc', // Slate 50
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-50px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(50px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        colorShift: {
          '0%': {
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))',
            transform: 'scale(1) rotate(0deg)'
          },
          '25%': {
            background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.15), rgba(20, 184, 166, 0.2), rgba(6, 182, 212, 0.15))',
            transform: 'scale(1.1) rotate(90deg)'
          },
          '50%': {
            background: 'linear-gradient(45deg, rgba(251, 191, 36, 0.12), rgba(249, 115, 22, 0.18), rgba(239, 68, 68, 0.12))',
            transform: 'scale(0.9) rotate(180deg)'
          },
          '75%': {
            background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.15))',
            transform: 'scale(1.05) rotate(270deg)'
          },
          '100%': {
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))',
            transform: 'scale(1) rotate(360deg)'
          }
        },
        patternShift: {
          '0%': {
            backgroundPosition: '0% 0%',
            filter: 'hue-rotate(0deg) brightness(1)',
            transform: 'scale(1)'
          },
          '25%': {
            backgroundPosition: '100% 0%',
            filter: 'hue-rotate(90deg) brightness(1.1)',
            transform: 'scale(1.05)'
          },
          '50%': {
            backgroundPosition: '100% 100%',
            filter: 'hue-rotate(180deg) brightness(0.9)',
            transform: 'scale(0.95)'
          },
          '75%': {
            backgroundPosition: '0% 100%',
            filter: 'hue-rotate(270deg) brightness(1.05)',
            transform: 'scale(1.02)'
          },
          '100%': {
            backgroundPosition: '0% 0%',
            filter: 'hue-rotate(360deg) brightness(1)',
            transform: 'scale(1)'
          }
        },
        wavePattern: {
          '0%': {
            backgroundPosition: '0% 50%',
            opacity: '0.3'
          },
          '50%': {
            backgroundPosition: '100% 50%',
            opacity: '0.6'
          },
          '100%': {
            backgroundPosition: '0% 50%',
            opacity: '0.3'
          }
        },
        slideUpSmooth: {
          '0%': {
            transform: 'translateY(100px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        fadeInScale: {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '0'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        subtleFloat: {
          '0%, 100%': {
            transform: 'translateY(0px)'
          },
          '50%': {
            transform: 'translateY(-10px)'
          }
        },
        gentleGlow: {
          '0%': {
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.1), 0 0 40px rgba(147, 197, 253, 0.05)',
            transform: 'scale(1)'
          },
          '50%': {
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.15), 0 0 60px rgba(147, 197, 253, 0.08)',
            transform: 'scale(1.01)'
          },
          '100%': {
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.1), 0 0 40px rgba(147, 197, 253, 0.05)',
            transform: 'scale(1)'
          }
        },
        softPulse: {
          '0%, 100%': {
            opacity: '0.6',
            transform: 'scale(1)'
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.05)'
          }
        },
        floatSlow: {
          '0%, 100%': {
            transform: 'translateY(0px) rotate(0deg)'
          },
          '50%': {
            transform: 'translateY(-20px) rotate(180deg)'
          }
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // Add utilities to prevent text clipping
      textShadow: {
        'none': 'none',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'default': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    // Plugin to add text shadow utilities
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-none': {
          textShadow: 'none',
        },
        '.text-shadow-sm': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        },
        '.text-shadow': {
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-md': {
          textShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          textShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-xl': {
          textShadow: '0 20px 25px rgba(0, 0, 0, 0.1)',
        },
        // Specific utilities for gradient text to prevent clipping
        '.gradient-text-safe': {
          backgroundClip: 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          paddingBottom: '0.1em',
          lineHeight: '1.1',
          display: 'inline-block',
        },
        '.gradient-text-block': {
          backgroundClip: 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          paddingBottom: '0.15em',
          lineHeight: '1.15',
          display: 'block',
        },
        // Dynamic Background Patterns
        '.pattern-dots': {
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px',
          animation: 'patternShift 20s ease-in-out infinite'
        },
        '.pattern-grid': {
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          animation: 'patternShift 25s ease-in-out infinite'
        },
        '.pattern-waves': {
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
          backgroundSize: '200% 200%',
          animation: 'wavePattern 15s ease-in-out infinite'
        },
        '.pattern-hexagon': {
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 2px, transparent 2px)',
          backgroundSize: '25px 25px',
          animation: 'patternShift 18s ease-in-out infinite'
        },
        '.pattern-diagonal': {
          backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 15px, rgba(255,255,255,0.08) 15px, rgba(255,255,255,0.08) 30px)',
          backgroundSize: '100% 100%',
          animation: 'patternShift 22s ease-in-out infinite'
        },
        // Professional Animations
        '.slide-up-smooth': {
          animation: 'slideUpSmooth 0.8s ease-out forwards'
        },
        '.fade-in-scale': {
          animation: 'fadeInScale 1s ease-out forwards'
        },
        '.subtle-float': {
          animation: 'subtleFloat 4s ease-in-out infinite'
        },
        '.gentle-glow': {
          animation: 'gentleGlow 4s ease-in-out infinite'
        },
        '.soft-pulse': {
          animation: 'softPulse 3s ease-in-out infinite'
        },
        '.trust-card': {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
