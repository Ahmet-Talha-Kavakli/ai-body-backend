import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../../../src/providers/ThemeProvider';
import { DSPressable } from '../../../src/design-system/primitives/Pressable';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

describe('DSPressable', () => {
  it('renders children', () => {
    const { getByText } = render(
      <DSPressable>
        <Text>Press me</Text>
      </DSPressable>,
      { wrapper },
    );
    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <DSPressable onPress={onPress}>
        <Text>Tap</Text>
      </DSPressable>,
      { wrapper },
    );
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
