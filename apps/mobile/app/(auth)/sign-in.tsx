import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignIn() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        router.replace('/(app)/home');
      }
    } catch (err: any) {
      Alert.alert('Hata', err.errors[0]?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg-primary p-6 justify-center">
      <Text className="text-text-primary text-3xl font-bold mb-2 text-center">FitAI</Text>
      <Text className="text-text-secondary text-center mb-8">Gücünüzü keşfedin</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#475569"
        value={email}
        onChangeText={setEmail}
        className="bg-bg-surface text-text-primary p-4 rounded-lg mb-4 border border-border-default"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Şifre"
        placeholderTextColor="#475569"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-bg-surface text-text-primary p-4 rounded-lg mb-6 border border-border-default"
      />

      <TouchableOpacity
        onPress={handleSignIn}
        disabled={loading}
        className={`p-4 rounded-lg ${loading ? 'bg-gray-600' : 'bg-accent-primary'}`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-bold text-lg">Giriş Yap</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')} className="mt-4">
        <Text className="text-text-secondary text-center">Hesabın yok mu? <Text className="text-accent-primary font-bold">Kaydol</Text></Text>
      </TouchableOpacity>
    </View>
  );
}
