import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useBodyCommand } from '../../../../src/hooks/useBodyData';
import { AIChatInline, type ChatMsg } from './components/AIChatPanel';

export default function AsistanRoute() {
  const [aiInput, setAiInput] = useState('');
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const aiCmd = useBodyCommand();

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
          Haptics.notificationAsync(
            d.action && d.action.type !== 'asked'
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
    <AIChatInline
      msgs={msgs}
      pending={aiCmd.isPending}
      aiInput={aiInput}
      setAiInput={setAiInput}
      onSend={handleSend}
    />
  );
}
