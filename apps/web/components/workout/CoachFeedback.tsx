'use client';

import React, { useEffect } from 'react';
import { playVoiceFeedback } from '@/lib/ai/voice-feedback';
import { Volume2, VolumeX } from 'lucide-react';

interface CoachFeedbackProps {
  feedback: string;
  isPlaying?: boolean;
}

export function CoachFeedback({
  feedback,
  isPlaying = false,
}: CoachFeedbackProps) {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  useEffect(() => {
    if (isPlaying && feedback) {
      setIsSpeaking(true);
      playVoiceFeedback(feedback).finally(() => setIsSpeaking(false));
    }
  }, [feedback, isPlaying]);

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3">
      {isSpeaking ? (
        <Volume2 className="w-5 h-5 text-blue-400 animate-pulse" />
      ) : (
        <VolumeX className="w-5 h-5 text-gray-500" />
      )}

      <div className="flex-1">
        <p className="text-sm text-blue-300">{feedback}</p>
      </div>
    </div>
  );
}
