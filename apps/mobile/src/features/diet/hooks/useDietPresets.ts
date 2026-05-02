import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/expo';
import { fetchPresets } from '../api/client';
import type { DietPreset } from '../api/types';

export function useDietPresets() {
  const { getToken } = useAuth();
  const [presets, setPresets] = useState<DietPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await fetchPresets(token);
      setPresets(data.presets);
    } catch (e) {
      console.error('[useDietPresets]', e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, []);

  return { presets, loading, refresh: load };
}
