import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/fumadocs-ui/dist/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
