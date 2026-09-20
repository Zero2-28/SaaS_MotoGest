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
      // ── Design Tokens MotoGest Pro — Azul metalizado ────────────────
      colors: {
        /**
         * BRAND — azul oscuro metalizado.
         * Duotono intencional: el 900 es navy (#0B2041) y el 800 petróleo
         * (#0F3341). Esa diferencia de matiz es la que produce el brillo
         * "metalizado" cuando se combinan en gradiente.
         */
        brand: {
          DEFAULT: '#0F3341',
          950: '#060F1C',
          900: '#0B2041',
          800: '#0F3341',
          700: '#15425A',
          600: '#1C5372',
          500: '#26688C',
          400: '#3D87AC',
          300: '#6BA8C8',
          200: '#A3C9DD',
          100: '#D3E5EF',
          50:  '#EEF5F9',
        },
        // CHROME — grises azulados para bordes, textos secundarios y superficies
        chrome: {
          50:  '#F1F5F9',
          100: '#E3EAF1',
          200: '#CFD9E2',
          300: '#B4C2CF',
          400: '#94A6B8',
          500: '#64798C',
          600: '#4F6375',
          700: '#33485C',
          800: '#22323F',
        },
        // Tokens neutros de página
        snow: '#FFFFFF',
        mist: '#F4F7FA',   // fondo de página claro
        ink:  '#0E1B2A',   // texto principal (negro con matiz azul)

        // ACENTO cálido — naranja (ofertas, destacados, ratings)
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
        },
        // EMBER — rojo del logo, reservado para el acento de marca
        ember: {
          DEFAULT: '#FF2A00',
          600: '#D62300',
          700: '#B31D00',
        },

        // ── Semánticos de estado ──────────────────────────────────────
        success: {
          DEFAULT: '#22C55E',
          50: '#F0FDF4', 100: '#DCFCE7', 600: '#16A34A', 700: '#15803D',
        },
        info: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF', 100: '#DBEAFE', 600: '#2563EB', 700: '#1D4ED8',
        },
        warning: {
          DEFAULT: '#EAB308',
          50: '#FEFCE8', 100: '#FEF9C3', 600: '#CA8A04', 700: '#A16207',
        },
        danger: {
          DEFAULT: '#DC2626',
          50: '#FEF2F2', 100: '#FEE2E2', 600: '#DC2626', 700: '#B91C1C',
        },

        // ── Tokens semánticos (shadcn/ui compatible) ──────────────────
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
      // ── Gradientes metalizados ─────────────────────────────────────
      backgroundImage: {
        // Superficie metálica principal (headers, hero, sidebar oscuro)
        'metal':        'linear-gradient(160deg, #15425A 0%, #0F3341 45%, #0B2041 100%)',
        // Botón primario — lectura de chapa pulida
        'metal-btn':    'linear-gradient(180deg, #1C5372 0%, #0F3341 100%)',
        'metal-btn-hv': 'linear-gradient(180deg, #26688C 0%, #15425A 100%)',
        // Barrido de brillo diagonal para cabeceras y cards destacadas
        'metal-sheen':  'linear-gradient(105deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.10) 48%, rgba(255,255,255,0) 62%)',
        // Filo cromado (bordes de 1px con degradado)
        'chrome-edge':  'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02))',
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
        // Brillo que recorre una superficie metálica
        sheen: {
          '0%':   { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.25s ease-out',
        'slide-in-left':  'slide-in-left 0.2s ease-out',
        shimmer:          'shimmer 2s infinite',
        marquee:          'marquee 28s linear infinite',
        sheen:            'sheen 1.1s ease-out',
      },
      // ── Sombras con tinte azul acero ───────────────────────────────
      boxShadow: {
        'brand':     '0 0 20px rgba(15,51,65,0.28)',
        'brand-lg':  '0 0 40px rgba(11,32,65,0.38)',
        'turbo':     '0 0 20px rgba(255,107,0,0.3)',
        // Elevación sobre fondo claro — sombra azulada, no gris
        'card':      '0 1px 2px rgba(11,32,65,0.06), 0 1px 3px rgba(11,32,65,0.10)',
        'card-md':   '0 2px 6px rgba(11,32,65,0.08), 0 8px 20px rgba(11,32,65,0.10)',
        'card-lg':   '0 8px 30px rgba(11,32,65,0.14)',
        // Filo interno claro: lo que hace que una superficie parezca metal
        'metal':     'inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.45)',
        'metal-lg':  'inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 30px rgba(6,15,28,0.55)',
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('tailwindcss-animate'),
  ],
}
