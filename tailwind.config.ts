import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        grove: {
          primary: '#166534',
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#22c55e',
        },
      },
    },
  },
  plugins: [],
}
export default config
