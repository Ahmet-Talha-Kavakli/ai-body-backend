import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <ScrollView className="flex-1 bg-bg-primary">
      <View className="p-6">
        {/* Profile Header */}
        <View className="bg-bg-surface rounded-2xl p-6 mb-6 border border-border-default items-center">
          <View
            className="w-20 h-20 rounded-full bg-accent-primary items-center justify-center mb-4"
            style={{
              backgroundColor: '#6366F1',
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Text className="text-white text-4xl">👤</Text>
          </View>
          <Text className="text-text-primary text-2xl font-bold mb-1">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-text-secondary text-sm">
            {user?.emailAddresses[0]?.emailAddress}
          </Text>
          <View className="mt-4 pt-4 border-t border-border-default w-full">
            <Text className="text-text-secondary text-xs text-center">Üye Olma Tarihi</Text>
            <Text className="text-text-primary text-sm text-center font-bold mt-1">
              {user?.createdAt?.toLocaleDateString('tr-TR')}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <Text className="text-text-primary text-lg font-bold mb-4">İstatistikler</Text>
        <View className="gap-4 mb-6">
          <View className="flex-row gap-4">
            <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
              <Text className="text-text-secondary text-xs mb-2">Toplam Seanslar</Text>
              <Text className="text-text-primary text-3xl font-bold">47</Text>
            </View>
            <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
              <Text className="text-text-secondary text-xs mb-2">Toplam Hacim</Text>
              <Text className="text-text-primary text-3xl font-bold">582k</Text>
            </View>
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
              <Text className="text-text-secondary text-xs mb-2">Ort. Form</Text>
              <Text className="text-text-primary text-3xl font-bold">76</Text>
            </View>
            <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
              <Text className="text-text-secondary text-xs mb-2">Streak</Text>
              <Text className="text-text-primary text-3xl font-bold">12</Text>
              <Text className="text-accent-energy text-xs mt-1">🔥 Harika!</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <Text className="text-text-primary text-lg font-bold mb-4">Seçenekler</Text>

        <TouchableOpacity
          onPress={() => router.push('/profile/settings')}
          className="bg-bg-surface rounded-xl p-4 mb-3 border border-border-default flex-row items-center justify-between active:bg-bg-elevated"
        >
          <Text className="text-text-primary font-bold">⚙️ Ayarlar</Text>
          <Text className="text-text-secondary text-xl">›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/profile/goals')}
          className="bg-bg-surface rounded-xl p-4 mb-3 border border-border-default flex-row items-center justify-between active:bg-bg-elevated"
        >
          <Text className="text-text-primary font-bold">🎯 Hedefler</Text>
          <Text className="text-text-secondary text-xl">›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/profile/passport')}
          className="bg-bg-surface rounded-xl p-4 mb-3 border border-border-default flex-row items-center justify-between active:bg-bg-elevated"
        >
          <Text className="text-text-primary font-bold">📊 Biyomechanical Passport</Text>
          <Text className="text-text-secondary text-xl">›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/profile/achievements')}
          className="bg-bg-surface rounded-xl p-4 mb-6 border border-border-default flex-row items-center justify-between active:bg-bg-elevated"
        >
          <Text className="text-text-primary font-bold">🏆 Başarılar</Text>
          <Text className="text-text-secondary text-xl">›</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-accent-danger rounded-xl p-4"
        >
          <Text className="text-white text-center font-bold text-base">Çıkış Yap</Text>
        </TouchableOpacity>

        {/* Footer Spacing */}
        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}
