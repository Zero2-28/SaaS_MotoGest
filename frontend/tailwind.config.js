/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      // ── Design Tokens MotoGest Pro ──────────────────────────────────
      colors: {
        // Fondo carbono
        carbon: {
          950: '#0A0A0A',
          900: '#111111',
          800: '#1A1A1A',
          700: '#242424',
          600: '#2E2E2E',
          500: '#3A3A3A',
        },
        // Rojo Ducati — acción primaria
        racing: {
          DEFAULT: '#CC0000',
          50:  '#FFF0F0',
          100: '#FFD6D6',
          200: '#FFADAD',
          300: '#FF7A7A',
          400: '#FF4040',
          500: '#FF0A0A',
          600: '#CC0000',
          700: '#A30000',
          800: '#7A0000',
          900: '#520000',
        },
        // Tokens claros para páginas públicas
        snow:         '#FFFFFF',
        'slate-light':'#F5F5F5',
        ink:          '#111111',
        // Naranja Honda — acento
        turbo: {
          DEFAULT: '#FF6B00',
          50:  '#FFF4EC',
          100: '#FFE2CC',
          200: '#FFC399',
          300: '#FFA366',
          400: '#FF8533',
          500: '#FF6B00',
          600: '#CC5500',
          700: '#994000',
          800: '#662B00',
          900: '#331500',
        },
        // Tokens semánticos (shadcn/ui compatible)
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      // ── Tipografía ─────────────────────────────────────────────────
      fontFamily: {
        // Display agresivo para títulos — estilo motor
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        // Limpia para datos y UI
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Escala tipográfica consistente
        'display-xl': ['4.5rem', { lineHeight: '1', letterSpacing: '0.02em' }],
        'display-lg': ['3.5rem', { lineHeight: '1.05', letterSpacing: '0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.15', letterSpacing: '0.01em' }],
      },
      // ── Border radius ──────────────────────────────────────────────
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // ── Animaciones ────────────────────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.25s ease-out',
        'slide-in-left':  'slide-in-left 0.2s ease-out',
        shimmer:          'shimmer 2s infinite',
        marquee:          'marquee 28s linear infinite',
      },
      // ── Sombras con tinte rojo ─────────────────────────────────────
      boxShadow: {
        'racing':  '0 0 20px rgba(204,0,0,0.3)',
        'racing-lg':'0 0 40px rgba(204,0,0,0.4)',
        'turbo':   '0 0 20px rgba(255,107,0,0.3)',
        'card':    '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('tailwindcss-animate'),
  ],
}
