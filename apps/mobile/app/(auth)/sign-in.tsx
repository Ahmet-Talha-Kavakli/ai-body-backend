import { useSignIn } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#F5F5F7',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#12121A',
    color: '#F5F5F7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default function SignIn() {
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    if (!isLoaded) return
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        router.replace('/(app)/home')
      }
    } catch (err: any) {
      Alert.alert('Hata', err.errors[0]?.message || 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitAI</Text>
      <Text style={styles.subtitle}>Gücünüzü keşfedin</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#475569"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Şifre"
        placeholderTextColor="#475569"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleSignIn}
        disabled={loading}
        style={[styles.button, { backgroundColor: loading ? '#4B5563' : '#6366F1' }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Giriş Yap</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')} style={{ marginTop: 16 }}>
        <Text style={{ color: '#94A3B8', textAlign: 'center' }}>
          Hesabın yok mu? <Text style={{ color: '#6366F1', fontWeight: '600' }}>Kaydol</Text>
        </Text>
      </TouchableOpacity>
    </View>
  )
}
