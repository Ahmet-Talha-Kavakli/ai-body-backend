import { useAuth } from '@clerk/expo';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <View className="flex-1 bg-bg-primary items-center justify-center">
      <Text className="text-text-primary text-2xl font-bold mb-4">FitAI Mobile</Text>
      {isSignedIn ? (
        <Link href="/dashboard" asChild>
          <Text className="text-accent-primary">Dashboard'a Git</Text>
        </Link>
      ) : (
        <Link href="/sign-in" asChild>
          <Text className="text-accent-primary">Giriş Yap</Text>
        </Link>
      )}
    </View>
  );
}
