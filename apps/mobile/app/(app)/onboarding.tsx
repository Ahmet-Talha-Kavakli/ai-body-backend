import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    age: '',
    fitnessLevel: 'beginner',
    goal: 'muscle_gain',
  });

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      router.replace('/(app)/home');
    }
  };

  const steps = [
    {
      title: 'Merhaba! 👋',
      desc: "FitAI'ye hoş geldiniz. Adınız nedir?",
      content: (
        <TextInput
          placeholder="Adınız"
          placeholderTextColor="#475569"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          className="bg-bg-surface text-text-primary p-4 rounded-lg border border-border-default text-base"
        />
      ),
    },
    {
      title: 'Yaşınız?',
      desc: 'Bu bize antrenman planınızı özelleştirmemize yardımcı olacak.',
      content: (
        <TextInput
          placeholder="Yaşınız"
          placeholderTextColor="#475569"
          value={formData.age}
          onChangeText={(text) => setFormData({ ...formData, age: text })}
          keyboardType="numeric"
          className="bg-bg-surface text-text-primary p-4 rounded-lg border border-border-default text-base"
        />
      ),
    },
    {
      title: 'Fitness Seviyesi',
      desc: 'Kaç yıldır antrenman yapıyorsunuz?',
      content: (
        <View className="gap-3">
          {[
            { id: 'beginner', label: '🟢 Başlangıç (0-1 yıl)' },
            { id: 'intermediate', label: '🟡 Orta (1-3 yıl)' },
            { id: 'advanced', label: '🔴 İleri (3+ yıl)' },
          ].map((level) => (
            <TouchableOpacity
              key={level.id}
              onPress={() => setFormData({ ...formData, fitnessLevel: level.id })}
              className={`p-4 rounded-lg border ${
                formData.fitnessLevel === level.id
                  ? 'bg-accent-primary border-accent-primary'
                  : 'bg-bg-surface border-border-default'
              }`}
            >
              <Text
                className={`font-bold text-base ${
                  formData.fitnessLevel === level.id ? 'text-white' : 'text-text-primary'
                }`}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      title: 'Hedefin Nedir?',
      desc: 'Antrenman stilinizi buna göre ayarlayacağız.',
      content: (
        <View className="gap-3">
          {[
            { id: 'weight_loss', label: '⬇️ Kilo Verme' },
            { id: 'muscle_gain', label: '💪 Kas Kazanma' },
            { id: 'strength', label: '🏋️ Güç Artırma' },
            { id: 'endurance', label: '🏃 Dayanıklılık' },
          ].map((g) => (
            <TouchableOpacity
              key={g.id}
              onPress={() => setFormData({ ...formData, goal: g.id })}
              className={`p-4 rounded-lg border ${
                formData.goal === g.id
                  ? 'bg-accent-primary border-accent-primary'
                  : 'bg-bg-surface border-border-default'
              }`}
            >
              <Text
                className={`font-bold text-base ${
                  formData.goal === g.id ? 'text-white' : 'text-text-primary'
                }`}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      title: 'Hazırsın! 🎉',
      desc: 'Antrenmanına başlamaya hazır mısın?',
      content: (
        <View className="bg-bg-surface rounded-2xl p-6 border border-border-default items-center">
          <Text className="text-text-primary font-bold text-lg mb-2">
            Hoşgeldin {formData.firstName}!
          </Text>
          <Text className="text-text-secondary text-center text-base">
            Tüm bilgiler kaydedildi. FitAI'yi keşfet ve antrenman yapmaya başla!
          </Text>
        </View>
      ),
    },
  ];

  const current = steps[step - 1];

  return (
    <ScrollView
      className="flex-1 bg-bg-primary"
      contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}
    >
      <View className="mb-8">
        {/* Progress Bar */}
        <View className="flex-row items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i <= step ? 'bg-accent-primary' : 'bg-bg-surface'
              }`}
            />
          ))}
        </View>
        <Text className="text-text-secondary text-xs text-center">Adım {step} / 5</Text>
      </View>

      {/* Content */}
      <Text className="text-text-primary text-3xl font-bold mb-2">{current.title}</Text>
      <Text className="text-text-secondary mb-8 text-base">{current.desc}</Text>

      <View className="mb-8">{current.content}</View>

      {/* Buttons */}
      <View className="gap-3">
        <TouchableOpacity onPress={handleNext} className="bg-accent-primary rounded-lg p-4">
          <Text className="text-white text-center font-bold text-lg">
            {step === 5 ? 'Başla' : 'İleri'}
          </Text>
        </TouchableOpacity>

        {step > 1 && (
          <TouchableOpacity
            onPress={() => setStep(step - 1)}
            className="bg-bg-surface rounded-lg p-4 border border-border-default"
          >
            <Text className="text-text-primary text-center font-bold text-base">Geri</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
