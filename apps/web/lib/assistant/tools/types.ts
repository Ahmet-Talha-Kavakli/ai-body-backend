/**
 * Tool registry tipleri.
 */

export type ToolCategory =
  | 'health_read'
  | 'water'
  | 'sleep'
  | 'medication'
  | 'nutrition'
  | 'activity'
  | 'body'
  | 'mental'
  | 'tools'
  | 'bloodwork'
  | 'social'
  | 'reminder'
  | 'knowledge'
  | 'people'
  | 'environment'
  | 'subscription'
  | 'finance'
  | 'productivity'
  | 'career'
  | 'hobby'
  | 'sports'
  | 'travel'
  | 'home'
  | 'social_life'
  | 'shopping'

export interface ToolDefinition {
  name: string
  category: ToolCategory
  description: string
  parameters: Record<string, unknown> // JSON Schema
  // Hedef: kullanıcının görüp onaylayacağı tehlikeli aksiyon mu
  destructive?: boolean
}

export interface ToolExecutor<P = unknown, R = unknown> {
  name: string
  execute: (args: { userId: string; params: P; messageId?: string | null }) => Promise<R>
}

export interface ToolResult {
  ok: boolean
  data?: unknown
  error?: string
  // UI'da inline kart için zengin metadata
  display?: {
    title: string
    subtitle?: string
    icon?: string
    color?: string
    undoable?: boolean
    undoToolCall?: { name: string; params: Record<string, unknown> }
  }
}
