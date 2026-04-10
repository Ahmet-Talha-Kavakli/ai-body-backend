import Vapi from '@vapi-ai/web';

export type CoachPersona = 'military' | 'scientific' | 'supportive' | 'friendly';

const VAPI_ASSISTANT_IDS: Record<CoachPersona, string> = {
  military:   process.env.NEXT_PUBLIC_VAPI_ASSISTANT_MILITARY!,
  scientific: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_SCIENTIFIC!,
  supportive: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_SUPPORTIVE!,
  friendly:   process.env.NEXT_PUBLIC_VAPI_ASSISTANT_FRIENDLY!,
};

export function createVapiInstance() {
  return new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
}

export async function startCoachSession(
  vapi: Vapi,
  persona: CoachPersona,
  systemPrompt: string
) {
  const assistantId = VAPI_ASSISTANT_IDS[persona];
  await vapi.start(assistantId, {
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
      ],
    },
  });
}

export function sendFormFeedback(vapi: Vapi, message: string) {
  vapi.say(message, false);
}
