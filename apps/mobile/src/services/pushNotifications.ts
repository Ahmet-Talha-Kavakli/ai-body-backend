/**
 * Expo push notification token alma + backend'e kayıt etme.
 * App açılışında çağırılır (auth sonrası).
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface RegisterArgs {
  apiUrl: string;
  getToken: () => Promise<string | null>;
}

let lastRegisteredToken: string | null = null;

/**
 * Push permission iste, token al, backend'e gönder.
 * Daha önce kayıt edilmişse aynı token tekrar gönderilmez.
 */
export async function registerForPushNotificationsAsync({
  apiUrl,
  getToken,
}: RegisterArgs): Promise<string | null> {
  if (!Device.isDevice) {
    // Simulator'da push token alınmaz, ama hata da verme
    return null;
  }

  try {
    // 1. Permission iste (yoksa)
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    // 2. Token al
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Constants as any).easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;
    if (!token) return null;

    // 3. Aynı token zaten kayıtlıysa atla
    if (token === lastRegisteredToken) return token;

    // 4. Backend'e gönder
    const authToken = await getToken();
    if (!authToken) return token; // auth yoksa sonra
    await fetch(`${apiUrl}/api/assistant/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token }),
    });
    lastRegisteredToken = token;

    // Android için kanal
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    return token;
  } catch {
    // Personal Team / push capability yoksa sessiz geç — ücretli Apple Developer hesabı gerekli
    return null;
  }
}

/**
 * Notification bandled açıldığında çağırılan handler.
 * Foreground'da banner gösterimi için.
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () =>
      ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
  });

  // V3 Faz C — Bildirim aksiyonları (iOS swipe / long-press menü)
  // Backend push payload'ında { categoryIdentifier: 'assistant_message' } gönderirse
  // bu actions çıkar. textInput "Yanıtla" — telefon kilitlenmeden cevap verme imkanı.
  Notifications.setNotificationCategoryAsync('assistant_message', [
    {
      identifier: 'reply',
      buttonTitle: 'Yanıtla',
      textInput: {
        submitButtonTitle: 'Gönder',
        placeholder: 'Mesaj yaz...',
      },
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'mute_8h',
      buttonTitle: 'Sessize al (8s)',
      options: { isDestructive: false, opensAppToForeground: false },
    },
  ]).catch(() => {});
}

/**
 * V3 Faz C — Kullanıcı bildirim aksiyonu yaptığında ("Yanıtla", "Sessize al")
 * çağrılan listener. App start'ta bir kez setup edilir.
 */
export function setupNotificationActionsListener(args: {
  apiUrl: string;
  getToken: () => Promise<string | null>;
}): { remove: () => void } {
  const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const action = response.actionIdentifier;
    const data = response.notification.request.content.data as
      | { conversationId?: string; type?: string }
      | undefined;

    if (action === 'reply' && response.userText && data?.conversationId) {
      // Kullanıcı bildirimde yazdığı text'i backend'e gönder (stream)
      try {
        const token = (await args.getToken()) ?? '';
        await fetch(`${args.apiUrl}/api/assistant/conversations/${data.conversationId}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: response.userText }),
        });
      } catch (e) {
        console.error('[notif/reply]', e);
      }
    } else if (action === 'mute_8h' && data?.conversationId) {
      try {
        const token = (await args.getToken()) ?? '';
        await fetch(`${args.apiUrl}/api/assistant/conversations/${data.conversationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mute: '8h' }),
        });
      } catch (e) {
        console.error('[notif/mute]', e);
      }
    }
  });
  return { remove: () => sub.remove() };
}
