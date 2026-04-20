import { useSignUp } from '@clerk/expo/legacy';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignUp() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleSignUp = async () => {
    console.log('[sign-up] button pressed', {
      isLoaded,
      hasSignUp: !!signUp,
      hasSetActive: !!setActive,
    });
    if (!signUp) {
      Alert.alert('Bekleyin', 'Clerk henüz yüklenmedi');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      const status = signUp.status;
      const unverified = signUp.unverifiedFields ?? [];
      console.log('[sign-up] after create', { status, unverified });

      if (status === 'complete' && setActive) {
        await setActive({ session: signUp.createdSessionId });
        router.replace('/(app)/onboarding');
        return;
      }

      if (unverified.includes('email_address')) {
        console.log('[sign-up] preparing verification via prepareVerification');
        await signUp.prepareVerification({ strategy: 'email_code' });
        setPendingVerification(true);
        return;
      }

      Alert.alert(
        'Beklenmeyen durum',
        `status: ${status}\nunverified: ${JSON.stringify(unverified)}`,
      );
    } catch (err: any) {
      console.log('[sign-up] create error', err);
      const msg = err?.errors?.[0]?.message ?? err?.message ?? 'Kayıt başarısız';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp || !setActive) return;
    setLoading(true);
    try {
      await signUp.attemptVerification({ strategy: 'email_code', code });
      const status = signUp.status;
      console.log('[sign-up] after verify', { status, createdSessionId: signUp.createdSessionId });
      if (status === 'complete') {
        await setActive({ session: signUp.createdSessionId });
        router.replace('/(app)/onboarding');
      } else {
        Alert.alert('Doğrulama tamamlanmadı', `status: ${status}`);
      }
    } catch (err: any) {
      console.log('[sign-up] verify error', err);
      const msg = err?.errors?.[0]?.message ?? err?.message ?? 'Doğrulama başarısız';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 bg-bg-primary p-6 justify-center">
        <Text className="text-text-primary text-3xl font-bold mb-2 text-center">
          E-posta Doğrulama
        </Text>
        <Text className="text-text-secondary text-center mb-8">
          {email} adresine gönderilen 6 haneli kodu gir. (Clerk test modu: 424242)
        </Text>
        <TextInput
          placeholder="6 haneli kod"
          placeholderTextColor="#475569"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          className="bg-bg-surface text-text-primary p-4 rounded-lg mb-6 border border-border-default text-center text-lg tracking-widest"
        />
        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading || code.length < 6}
          className={`p-4 rounded-lg ${loading || code.length < 6 ? 'bg-gray-600' : 'bg-accent-primary'}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">Doğrula</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setPendingVerification(false);
            setCode('');
            setEmail('');
            setPassword('');
            setPasswordConfirm('');
          }}
          className="mt-4"
        >
          <Text className="text-text-secondary text-center">← Geri dön, email değiştir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-primary p-6 justify-center">
      <Text className="text-text-primary text-3xl font-bold mb-2 text-center">
        FitAI&apos;ye Hoş Geldin
      </Text>
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
        <Text className="text-text-secondary text-center">
          Zaten hesabın var mı? <Text className="text-accent-primary font-bold">Giriş Yap</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
