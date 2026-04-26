import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RekorlarTab } from './_shared';
import { useAktivite } from './_ctx';

export default function RekorlarRoute() {
  const insets = useSafeAreaInsets();
  const { catalog, api } = useAktivite();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12, backgroundColor: '#F2F2F7' }}>
      <RekorlarTab catalog={catalog} fetchAllRecords={api.fetchAllRecords} />
    </View>
  );
}
