export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        warm: '#FAFAF7',
        card: '#FFFFFF',
        accent: '#8E9BFF',
        secondary: '#B8A4E3',
        ink: '#1F1F1F',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 24px 80px rgba(31, 31, 31, 0.08)',
        calm: '0 16px 45px rgba(142, 155, 255, 0.15)',
      },
      borderRadius: {
        calm: '28px',
      },
    },
  },
  plugins: [],
}
