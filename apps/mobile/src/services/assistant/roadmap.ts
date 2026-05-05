/**
 * AI Story / Road Map — V3 Faz C
 */

export interface MilestoneCommentItem {
  id: string;
  content: string;
  createdAt: string;
}

export interface MilestoneCharacterItem {
  id: string;
  name: string;
  relationship: string;
  description: string | null;
  avatarUrl: string | null;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  bodyText: string | null; // kilitli ise null
  illustrationUrl: string | null;
  age: number | null;
  year: number | null;
  location: string | null;
  emotion: string | null;
  isLocked: boolean;
  unlockedAt: string | null;
  arcType: string;
  importance: number;
  chronologicalOrder: number;
  comments: MilestoneCommentItem[];
  characters: MilestoneCharacterItem[];
}

// V3 Faz C — Birlikte yaşanan anlar (pivot 0, sonrası 1+)
export interface SharedMilestone {
  id: string;
  type: string; // 'first_meeting' | 'first_star' | ...
  title: string;
  bodyText: string | null;
  illustrationUrl: string | null;
  emotion: string | null;
  importance: number;
  sharedOrder: number;
  occurredAt: string;
  comments: MilestoneCommentItem[];
}

export async function postMilestoneComment(args: {
  apiUrl: string;
  token: string;
  mid: string;
  type: 'past' | 'shared';
  content: string;
}): Promise<MilestoneCommentItem | null> {
  try {
    const res = await fetch(
      `${args.apiUrl}/api/assistant/milestones/${args.mid}/comment?type=${args.type}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${args.token}`,
        },
        body: JSON.stringify({ content: args.content }),
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as MilestoneCommentItem;
  } catch {
    return null;
  }
}

export async function deleteMilestoneComment(args: {
  apiUrl: string;
  token: string;
  mid: string;
  commentId: string;
}): Promise<boolean> {
  try {
    const res = await fetch(
      `${args.apiUrl}/api/assistant/milestones/${args.mid}/comment?commentId=${args.commentId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${args.token}` },
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export interface RoadmapResponse {
  status: 'pending' | 'generating' | 'ready' | 'failed';
  profile: {
    name: string;
    archetype: string | null;
    bornAt: string | null;
    ageAtCreation: number | null;
  };
  story: {
    birthplace: string | null;
    childhood: string | null;
    familyDynamics: string | null;
    firstLoss: string | null;
    firstLove: string | null;
    passion: string | null;
    achievement: string | null;
    failure: string | null;
    turningPoint: string | null;
    currentSituation: string | null;
    generatedAt: string | null;
  } | null;
  milestones: RoadmapMilestone[];
  sharedMilestones: SharedMilestone[];
}

export async function fetchRoadmap(args: {
  apiUrl: string;
  token: string;
}): Promise<RoadmapResponse | null> {
  try {
    const res = await fetch(`${args.apiUrl}/api/assistant/story`, {
      headers: { Authorization: `Bearer ${args.token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as RoadmapResponse;
  } catch {
    return null;
  }
}
