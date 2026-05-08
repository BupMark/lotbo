import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Palette officielle LOTBO — brandbook v1.0 ──
        night:   '#1A1410',
        brique:  '#C8431A',
        or:      '#D4A820',
        creme:   '#F7F2E8',
        terre:   '#8C5A40',
        brume:   '#E8E0D0',

        // Alias sémantiques (pour className Tailwind dans les composants)
        primary: {
          DEFAULT: '#C8431A',   // bg-primary  → remplace bg-[#1D9E75]
          hover:   '#D4561A',   // bg-primary-hover
          light:   'rgba(200, 67, 26, 0.12)',  // bg-primary-light
        },
      },
      fontFamily: {
        display:   ['Playfair Display', 'Georgia', 'serif'],
        editorial: ['DM Serif Display', 'Georgia', 'serif'],
        ui:        ['DM Sans', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // Multiples de 8px — grille brandbook
        '18': '72px',
        '22': '88px',
        '26': '104px',
      },
      borderRadius: {
        'sm':  '6px',
        'md':  '10px',
        'lg':  '14px',
        'xl':  '20px',
        '2xl': '28px',
      },
    },
  },
  plugins: [],
}

export default config