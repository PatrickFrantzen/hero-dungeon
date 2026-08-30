/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  content: ['./src/**/*.{html,ts}'],
  corePlugins: {
    // Angular Material bringt eigene Base-/Reset-Styles mit; Tailwinds Preflight
    // wuerde diese ueberschreiben.
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
