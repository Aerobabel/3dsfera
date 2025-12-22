/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cosmic: {
          900: '#050914',
          800: '#0a1324',
          700: '#0f1d33',
          neon: '#44a4ff',
          glow: '#60a5fa',
        },
      },
      backgroundImage: {
        'cosmic-gradient':
          'radial-gradient(120% 120% at 20% 20%, rgba(68,164,255,0.16), transparent), radial-gradient(140% 140% at 80% 10%, rgba(80,70,255,0.18), transparent), linear-gradient(135deg, #050914 0%, #0a1324 45%, #050914 100%)',
      },
      boxShadow: {
        glass: '0 20px 80px rgba(0,0,0,0.45)',
        glow: '0 10px 40px rgba(68,164,255,0.35)',
      },
    },
  },
  plugins: [],
};
