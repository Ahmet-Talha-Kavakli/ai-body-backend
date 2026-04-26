import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotalarTab } from './_shared';

export default function RotalarRoute() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <RotalarTab />
    </View>
  );
}
