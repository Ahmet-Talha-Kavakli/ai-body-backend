// apps/web/lib/ai/voice-feedback.ts

export interface VoiceFeedbackOptions {
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
  language?: string; // 'tr-TR', 'en-US'
}

const DEFAULT_OPTIONS: VoiceFeedbackOptions = {
  rate: 1.2,
  pitch: 1,
  volume: 1,
  language: 'tr-TR',
};

export async function playVoiceFeedback(
  text: string,
  options: VoiceFeedbackOptions = {}
): Promise<void> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Check browser support
    const SpeechSynthesisUtterance =
      window.SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;

    if (!SpeechSynthesisUtterance) {
      console.error('Speech Synthesis not supported');
      reject(new Error('Speech Synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = finalOptions.language!;
    utterance.rate = finalOptions.rate!;
    utterance.pitch = finalOptions.pitch!;
    utterance.volume = finalOptions.volume!;

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    window.speechSynthesis.cancel(); // Cancel any previous speech
    window.speechSynthesis.speak(utterance);
  });
}

export function stopVoiceFeedback(): void {
  window.speechSynthesis.cancel();
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    (!!window.SpeechSynthesisUtterance ||
      !!(window as any).webkitSpeechSynthesisUtterance)
  );
}
