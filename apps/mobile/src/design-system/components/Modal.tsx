import React from 'react';
import { Modal as RNModal, View, ModalProps, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';

type DSModalProps = ModalProps & {
  children: React.ReactNode;
};

export function DSModal({ children, ...rest }: DSModalProps) {
  const { colors } = useTheme();

  const overlay: ViewStyle = {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  };

  const content: ViewStyle = {
    backgroundColor: colors.bg.surfaceElevated,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    width: '100%',
  };

  return (
    <RNModal animationType="fade" transparent statusBarTranslucent {...rest}>
      <View style={overlay}>
        <View style={content}>{children}</View>
      </View>
    </RNModal>
  );
}
