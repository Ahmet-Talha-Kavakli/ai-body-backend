import { useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useNutritionCommand } from '../../../../src/hooks/useNutritionCommand';
import { AIChatInline, type ChatMsg } from '../saglik/components/AIChatPanel';

const MUTATING_ACTIONS = new Set([
  'log_meal',
  'quick_add',
  'delete_last_meal',
  'delete_meal_item',
  'set_calorie_goal',
  'set_macro_goals',
  'auto_calculate_goal',
  'add_pantry_item',
  'apply_recipe',
  'apply_template',
  'start_diet_plan',
  'stop_diet_plan',
  'apply_diet_day',
]);

export default function NutritionAsistanRoute() {
  const [aiInput, setAiInput] = useState('');
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const aiCmd = useNutritionCommand();

  const handleSend = () => {
    const msg = aiInput.trim();
    if (!msg || aiCmd.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAiInput('');

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', text: msg };
    const history = msgs.map((m) => ({ role: m.role, content: m.text }));
    setMsgs((prev) => [...prev, userMsg]);

    aiCmd.mutate(
      { message: msg, conversationHistory: history },
      {
        onSuccess: (d) => {
          const aiMsg: ChatMsg = { id: `a-${Date.now()}`, role: 'assistant', text: d.reply };
          setMsgs((prev) => [...prev, aiMsg]);
          const actionType = d.action?.type;
          if (actionType && MUTATING_ACTIONS.has(actionType)) {
            DeviceEventEmitter.emit('nutrition:dirty');
          }
          Haptics.notificationAsync(
            actionType && actionType !== 'asked'
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning,
          );
        },
        onError: () => {
          const errMsg: ChatMsg = {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: 'Bir hata oluştu, tekrar dene.',
          };
          setMsgs((prev) => [...prev, errMsg]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        },
      },
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AIChatInline
        msgs={msgs}
        pending={aiCmd.isPending}
        aiInput={aiInput}
        setAiInput={setAiInput}
        onSend={handleSend}
        accentColor="#FF9F0A"
        accentGradient={['#FFD08A', '#FF9F0A', '#D97706']}
        bgGradient={['#FFFAF2', '#F2F2F7']}
      />
    </>
  );
}
