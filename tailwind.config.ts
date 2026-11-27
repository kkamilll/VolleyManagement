import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        steel: {
          50: '#f4f6f8',
          100: '#e5e9ee',
          200: '#cbd4dd',
          300: '#a3b4c4',
          400: '#758fa7',
          500: '#53708c',
          600: '#405872',
          700: '#34475c',
          800: '#2b3a4a',
          900: '#26323f',
          950: '#151d26',
        },
        dark: {
          950: '#07090c',
          900: '#0c1015',
          850: '#11161d',
          800: '#181f29',
          750: '#1e2633',
          700: '#263140',
        },
        bone: {
          DEFAULT: '#f2efe9',
          light: '#fbfaf8',
          dark: '#dcd8cf',
        },
        ice: {
          DEFAULT: '#38bdf8',
          glow: '#0284c7',
        },
        cyber: {
          darkest: '#05070a',
          dark: '#080c13',
          card: '#0c121d',
          cardHover: '#111a29',
          border: 'rgba(56, 189, 248, 0.18)',
          borderHover: 'rgba(56, 189, 248, 0.45)',
          cyan: '#00e5ff',
          sky: '#0ea5e9',
          gold: '#f59e0b',
          goldGlow: '#fbbf24',
        }
      },
      backgroundImage: {
        'angel-radial': 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.12) 0%, rgba(12, 16, 21, 0) 70%)',
        'angel-mesh': 'linear-gradient(to bottom, #07090c 0%, #0d1217 50%, #080a0e 100%)',
        'cyber-gradient': 'linear-gradient(135deg, rgba(12, 18, 29, 0.95) 0%, rgba(8, 12, 20, 0.98) 100%)',
        'cyber-glow-cyan': 'radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(14, 165, 233, 0.15), transparent 40%)',
      }
    },
  },
  plugins: [],
};
export default config;
