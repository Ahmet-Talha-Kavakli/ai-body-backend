const { colors } = require('./src/design-system/tokens/colors');

module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-primary': colors.bg.primary,
        'bg-canvas': colors.bg.canvas,
        'bg-surface': colors.bg.surface,
        'bg-elevated': colors.bg.surfaceElevated,
        'bg-hover': colors.bg.surfaceHover,
        'text-primary': colors.text.primary,
        'text-secondary': colors.text.secondary,
        'text-tertiary': colors.text.tertiary,
        'text-disabled': colors.text.disabled,
        'border-subtle': colors.border.subtle,
        'border-default': colors.border.default,
        'border-strong': colors.border.strong,
        'border-focus': colors.border.focus,
        accent: colors.accent.primary,
        'accent-bright': colors.accent.primaryBright,
        'accent-dim': colors.accent.primaryDim,
        'accent-muted': colors.accent.muted,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        info: colors.info,
        recovery: colors.recovery,
        'ai-start': colors.ai.glowStart,
        'ai-end': colors.ai.glowEnd,
      },
    },
  },
};
