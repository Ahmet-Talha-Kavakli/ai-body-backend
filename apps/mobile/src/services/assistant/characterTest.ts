/**
 * Character Test Service — V3 Faz C
 */

export type Archetype =
  | 'comedian'
  | 'philosopher'
  | 'street'
  | 'princess'
  | 'artist'
  | 'soldier'
  | 'sage'
  | 'rebel'
  | 'warm_friend';

export interface TestOption {
  id: string;
  label: string;
}

export interface TestQuestion {
  id: string;
  prompt: string;
  options: TestOption[];
}

export interface TestStatus {
  questions: TestQuestion[];
  completed: boolean;
  currentArchetype: Archetype;
}

export interface TestAnswer {
  questionId: string;
  optionId: string;
}

export interface TestResult {
  archetype: Archetype;
  label: string;
  blurb: string;
  name: string;
  nameSuggested: boolean;
}

export async function fetchCharacterTest(args: {
  apiUrl: string;
  token: string;
}): Promise<TestStatus | null> {
  try {
    const res = await fetch(`${args.apiUrl}/api/assistant/character-test`, {
      headers: { Authorization: `Bearer ${args.token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as TestStatus;
  } catch {
    return null;
  }
}

export async function submitCharacterTest(args: {
  apiUrl: string;
  token: string;
  answers: TestAnswer[];
}): Promise<TestResult | null> {
  try {
    const res = await fetch(`${args.apiUrl}/api/assistant/character-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${args.token}`,
      },
      body: JSON.stringify({ answers: args.answers }),
    });
    if (!res.ok) {
      console.error('[character-test/submit]', res.status, await res.text().catch(() => ''));
      return null;
    }
    return (await res.json()) as TestResult;
  } catch (e) {
    console.error('[character-test/submit]', e);
    return null;
  }
}
