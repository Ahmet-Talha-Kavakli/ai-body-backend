import React, { useCallback, useRef } from 'react';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme } from '../../providers/ThemeProvider';

type SheetProps = {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
};

export function Sheet({ children, snapPoints = ['50%', '90%'], onClose }: SheetProps) {
  const { colors } = useTheme();
  const ref = useRef<BottomSheet>(null);

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg.surfaceElevated }}
      handleIndicatorStyle={{ backgroundColor: colors.border.strong }}
    >
      <BottomSheetView>{children}</BottomSheetView>
    </BottomSheet>
  );
}
