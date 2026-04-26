import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IndirTab } from './_shared';

export default function IndirRoute() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12, backgroundColor: '#F2F2F7' }}>
      <IndirTab />
    </View>
  );
}
