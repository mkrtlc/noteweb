/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name, steps) => Object.fromEntries(steps.map((s) => [s, v(`${name}-${s}`)]));
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export default {
  darkMode: 'class',
  content: ['./index.html', './App.tsx', './index.tsx', './components/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        white: v('white'),
        'on-accent': v('on-accent'),
        slate: scale('slate', [...steps, 950]),
        brand: scale('brand', steps),
        red: { 50: v('red-50'), 100: v('red-100') },
        amber: { 50: v('amber-50'), 100: v('amber-100') },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
