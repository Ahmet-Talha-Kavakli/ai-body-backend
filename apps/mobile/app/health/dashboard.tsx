import { Text, View } from 'react-native'

export default function HealthDashboard() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0A0A0F',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 18 }}>Sağlık verileri yakında</Text>
    </View>
  )
}
