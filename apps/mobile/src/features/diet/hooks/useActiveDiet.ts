import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useAuth } from '@clerk/expo';
import { fetchActivePlan, stopPlan, applyMenu, applyDay } from '../api/client';
import type { ActiveDietPlan } from '../api/types';

export function useActiveDiet() {
  const { getToken } = useAuth();
  const [plan, setPlan] = useState<ActiveDietPlan | null | undefined>(undefined);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await fetchActivePlan(token);
      setPlan(data.plan);
    } catch (e) {
      console.error('[useActiveDiet]', e);
      setPlan(null);
    } finally {
      loadingRef.current = false;
    }
  }, [getToken]);

  useEffect(() => {
    load();
    const sub = DeviceEventEmitter.addListener('diet:dirty', load);
    return () => sub.remove();
  }, [load]);

  const stop = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    await stopPlan(token);
    setPlan(null);
    DeviceEventEmitter.emit('diet:dirty');
    DeviceEventEmitter.emit('nutrition:dirty');
  }, [getToken]);

  const apply = useCallback(
    async (menuId: string) => {
      const token = await getToken();
      if (!token) throw new Error('no token');
      const res = await applyMenu(token, menuId);
      await load();
      DeviceEventEmitter.emit('diet:dirty');
      DeviceEventEmitter.emit('nutrition:dirty');
      return res;
    },
    [getToken, load],
  );

  const applyAllDay = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('no token');
    const res = await applyDay(token);
    await load();
    DeviceEventEmitter.emit('diet:dirty');
    DeviceEventEmitter.emit('nutrition:dirty');
    return res;
  }, [getToken, load]);

  // undefined = henüz yüklenmedi, null = plan yok, object = plan var
  const loading = plan === undefined;

  return { plan: plan ?? null, loading, refresh: load, stop, apply, applyAllDay };
}
