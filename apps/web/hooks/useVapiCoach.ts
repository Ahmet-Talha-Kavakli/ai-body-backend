'use client';

import { useRef, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { createVapiInstance, startCoachSession, sendFormFeedback } from '@/lib/vapi/session';
import { buildCoachSystemPrompt } from '@/lib/vapi/prompt-builder';
import type { CoachPersona } from '@/lib/vapi/session';

interface UseVapiCoachOptions {
  persona: CoachPersona;
  userContext: Parameters<typeof buildCoachSystemPrompt>[1];
}

export function useVapiCoach({ persona, userContext }: UseVapiCoachOptions) {
  const vapiRef = useRef<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastFeedbackTime = useRef(0);

  const connect = useCallback(async () => {
    const vapi = createVapiInstance();
    vapiRef.current = vapi;

    vapi.on('call-start', () => setIsConnected(true));
    vapi.on('call-end', () => setIsConnected(false));
    vapi.on('speech-start', () => setIsSpeaking(true));
    vapi.on('speech-end', () => setIsSpeaking(false));

    const systemPrompt = buildCoachSystemPrompt(persona, userContext);
    await startCoachSession(vapi, persona, systemPrompt);
  }, [persona, userContext]);

  const disconnect = useCallback(() => {
    vapiRef.current?.stop();
    vapiRef.current = null;
    setIsConnected(false);
  }, []);

  const reportFormError = useCallback((message: string, severity: 'low' | 'medium' | 'high') => {
    if (!vapiRef.current || !isConnected) return;
    if (severity === 'low') return;

    const now = Date.now();
    const cooldown = severity === 'high' ? 3000 : 5000;
    if (now - lastFeedbackTime.current < cooldown) return;

    sendFormFeedback(vapiRef.current, message);
    lastFeedbackTime.current = now;
  }, [isConnected]);

  return { connect, disconnect, reportFormError, isConnected, isSpeaking };
}
