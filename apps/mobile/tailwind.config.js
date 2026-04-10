module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0A0A0F',
        'bg-surface': '#12121A',
        'bg-elevated': '#1A1A26',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'border-default': '#1E293B',
        'accent-primary': '#6366F1',
        'accent-energy': '#F59E0B',
        'accent-success': '#10B981',
        'accent-danger': '#EF4444',
        'accent-recovery': '#8B5CF6',
      },
    },
  },
};
