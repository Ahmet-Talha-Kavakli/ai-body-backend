import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function Screen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={st.root}>
        <Text style={st.text}>Yakında</Text>
      </View>
    </>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 22, fontWeight: '700' },
});
