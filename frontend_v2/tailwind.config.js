/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT:      '#4f46e5', // indigo-600  — primary buttons, links
          dark:         '#4338ca', // indigo-700  — hover
          light:        '#eef2ff', // indigo-50   — subtle backgrounds
          purple:       '#7c3aed', // violet-600  — gift/AI accent
          'purple-light':'#ede9fe', // violet-100
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.35s ease both',
        'fade-in':    'fadeIn 0.2s ease both',
        'pop':        'pop 0.35s ease both',
        'toast-slide':'toastSlide 0.3s ease both',
        'pulse-dot':  'pulseDot 1s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        pop: {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '70%':  { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        toastSlide: {
          from: { opacity: '0', transform: 'translateX(60px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      borderRadius: {
        card: '14px',
        card2: '20px',
      },
      boxShadow: {
        card:      '0 8px 24px rgba(99, 102, 241, 0.1)',
        'card-hover': '0 12px 32px rgba(99, 102, 241, 0.15)',
        auth:      '0 20px 60px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};