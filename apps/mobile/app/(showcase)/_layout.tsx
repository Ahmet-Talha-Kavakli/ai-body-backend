import { Stack } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';

export default function ShowcaseLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.surface },
        headerTintColor: colors.text.primary,
        title: 'Design System Showcase',
      }}
    />
  );
}
