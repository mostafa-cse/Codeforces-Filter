/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cf: {
          bg: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          text: '#c9d1d9',
          muted: '#8b949e',
          accent: '#58a6ff',
          hover: '#1f242c',
          new: '#238636',
          unrated: '#6e7681',
        },
        rating: {
          newbie: '#cccccc',
          pupil: '#77ff77',
          specialist: '#77ddbb',
          expert: '#aaaaff',
          cm: '#ff88ff',
          master: '#ffcc88',
          im: '#ffbb55',
          gm: '#ff7777',
          igm: '#ff3333',
          lgm: '#aa0000',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
