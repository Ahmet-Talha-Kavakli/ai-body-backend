import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../src/providers/ThemeProvider';
import { DSTextInput } from '../../../../src/design-system/components/TextInput';
import { DSSwitch } from '../../../../src/design-system/components/Switch';

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

describe('DSTextInput', () => {
  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <DSTextInput placeholder="Enter name" onChangeText={() => {}} value="" />,
      { wrapper: W },
    );
    expect(getByPlaceholderText('Enter name')).toBeTruthy();
  });

  it('calls onChangeText', () => {
    const fn = jest.fn();
    const { getByPlaceholderText } = render(
      <DSTextInput placeholder="Type" onChangeText={fn} value="" />,
      { wrapper: W },
    );
    fireEvent.changeText(getByPlaceholderText('Type'), 'hello');
    expect(fn).toHaveBeenCalledWith('hello');
  });

  it('shows error state', () => {
    const { getByText } = render(
      <DSTextInput placeholder="x" onChangeText={() => {}} value="" error="Required" />,
      { wrapper: W },
    );
    expect(getByText('Required')).toBeTruthy();
  });
});

describe('DSSwitch', () => {
  it('toggles', () => {
    const fn = jest.fn();
    const { getByTestId } = render(<DSSwitch value={false} onValueChange={fn} testID="sw" />, {
      wrapper: W,
    });
    fireEvent(getByTestId('sw'), 'valueChange', true);
    expect(fn).toHaveBeenCalledWith(true);
  });
});
