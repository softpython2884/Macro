
import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
        '5xl': '3440px',
      },
      fontFamily: {
        sans: ['Inter', 'Sora', ...fontFamily.sans],
      },
      spacing: {
        'safe': '80px',
        'grid': '8px',
        'gutter': '32px',
      },
      fontSize: {
        'display': ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline': ['40px', { lineHeight: '1.2', fontWeight: '600' }],
        'body': ['24px', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['18px', { lineHeight: '1.3', letterSpacing: '0.05em', fontWeight: '400', textTransform: 'uppercase' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Design System specific colors
        obsidian: "#0A0B10",
        charcoal: "#161821",
        cyan: "#00F0FF",
        violet: "#7000FF",
        emerald: "#00E676",
        crimson: "#FF1744",
        frost: "#F5F5F7",
        slate: "#8E8E93",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "100px",
      },
      aspectRatio: {
        'gaming': '2 / 3',
        'media': '16 / 9',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: '0', transform: 'scale(0.95)' },
          "100%": { opacity: '1', transform: 'scale(1)' },
        },
         "fade-in-slow": {
          "0%": { opacity: '0', transform: 'translateY(10px)' },
          "100%": { opacity: '1', transform: 'translateY(0)' },
        },
        "zoom-in-fade": {
          "0%": { opacity: '0', transform: 'scale(0.95)' },
          "100%": { opacity: '1', transform: 'scale(1)' },
        },
        "zoom-out-fade": {
            "0%": { opacity: '1', transform: 'scale(1)' },
            "100%": { opacity: '0', transform: 'scale(1.05)' },
        },
        "shake": {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        "levitate": {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shine: {
          '0%': { 'background-position': '100%' },
          '100%': { 'background-position': '-100%' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": 'fade-in 0.5s ease-in-out forwards',
        "fade-in-slow": 'fade-in-slow 0.8s ease-in-out forwards',
        "zoom-in-fade": 'zoom-in-fade 0.5s ease-out forwards',
        "zoom-out-fade": 'zoom-out-fade 0.5s ease-out forwards',
        "shake": 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
        "levitate": 'levitate 3s ease-in-out infinite',
        shine: 'shine 5s linear infinite',
        // 60fps optimized animations
        'smooth': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'micro': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'page': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'crossfade': 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      dropShadow: {
        'glow': '0 0 20px rgba(0, 240, 255, 0.4)',
        'glow-strong': '0 0 30px rgba(0, 240, 255, 0.6)',
      },
      boxShadow: {
        'focus': '0 0 20px rgba(0, 240, 255, 0.4)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
