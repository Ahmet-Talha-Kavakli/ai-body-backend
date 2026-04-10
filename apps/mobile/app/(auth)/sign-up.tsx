import { useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignUp() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (password !== passwordConfirm) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      router.replace('/(app)/onboarding');
    } catch (err: any) {
      Alert.alert('Hata', err.errors[0]?.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg-primary p-6 justify-center">
      <Text className="text-text-primary text-3xl font-bold mb-2 text-center">FitAI'ye Hoş Geldin</Text>
      <Text className="text-text-secondary text-center mb-8">Antrenmanına başla</Text>

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
        className="bg-bg-surface text-text-primary p-4 rounded-lg mb-4 border border-border-default"
      />

      <TextInput
        placeholder="Şifreyi Onayla"
        placeholderTextColor="#475569"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
        className="bg-bg-surface text-text-primary p-4 rounded-lg mb-6 border border-border-default"
      />

      <TouchableOpacity
        onPress={handleSignUp}
        disabled={loading}
        className={`p-4 rounded-lg ${loading ? 'bg-gray-600' : 'bg-accent-primary'}`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-bold text-lg">Kaydol</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} className="mt-4">
        <Text className="text-text-secondary text-center">Zaten hesabın var mı? <Text className="text-accent-primary font-bold">Giriş Yap</Text></Text>
      </TouchableOpacity>
    </View>
  );
}
