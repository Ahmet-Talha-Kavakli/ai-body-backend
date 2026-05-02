/**
 * Tool Registry — tüm tool'ları tek noktadan toplar.
 */

import { ToolDefinition, ToolExecutor, ToolResult } from './types'
import { healthReadToolDefs, healthReadExecutors } from './health-read'
import { waterToolDefs, waterExecutors } from './water'
import { sleepToolDefs, sleepExecutors } from './sleep'
import { peopleToolDefs, peopleExecutors } from './people'
import { reminderToolDefs, reminderExecutors } from './reminder'
import { memoryToolDefs, memoryExecutors } from './memory'
import { medicationToolDefs, medicationExecutors } from './medication'
import { nutritionToolDefs, nutritionExecutors } from './nutrition'
import { activityToolDefs, activityExecutors } from './activity'
import { moodToolDefs, moodExecutors } from './mood'
import { toolsActionDefs, toolsActionExecutors } from './tools-actions'
import { bodyToolDefs, bodyExecutors } from './body'
import { bloodWorkToolDefs, bloodWorkExecutors } from './bloodwork'
import { environmentToolDefs, environmentExecutors } from './environment'
import { healthkitToolDefs, healthkitExecutors } from './healthkit'
import { calendarToolDefs, calendarExecutors } from './calendar'
import { contactsToolDefs, contactsExecutors } from './contacts'

export const ALL_TOOL_DEFS: ToolDefinition[] = [
  ...healthReadToolDefs,
  ...waterToolDefs,
  ...sleepToolDefs,
  ...peopleToolDefs,
  ...reminderToolDefs,
  ...memoryToolDefs,
  ...medicationToolDefs,
  ...nutritionToolDefs,
  ...activityToolDefs,
  ...moodToolDefs,
  ...toolsActionDefs,
  ...bodyToolDefs,
  ...bloodWorkToolDefs,
  ...environmentToolDefs,
  ...healthkitToolDefs,
  ...calendarToolDefs,
  ...contactsToolDefs,
]

export const ALL_EXECUTORS: Record<string, ToolExecutor> = {
  ...healthReadExecutors,
  ...waterExecutors,
  ...sleepExecutors,
  ...peopleExecutors,
  ...reminderExecutors,
  ...memoryExecutors,
  ...medicationExecutors,
  ...nutritionExecutors,
  ...activityExecutors,
  ...moodExecutors,
  ...toolsActionExecutors,
  ...bodyExecutors,
  ...bloodWorkExecutors,
  ...environmentExecutors,
  ...healthkitExecutors,
  ...calendarExecutors,
  ...contactsExecutors,
}

/**
 * OpenAI Function calling formatına dönüştür.
 */
export function toOpenAIFunctions() {
  return ALL_TOOL_DEFS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }))
}

/**
 * Bir tool'u çağır.
 */
export async function executeTool(
  name: string,
  args: { userId: string; params: unknown }
): Promise<ToolResult> {
  const executor = ALL_EXECUTORS[name]
  if (!executor) {
    return { ok: false, error: `unknown_tool: ${name}` }
  }
  try {
    const result = await executor.execute(args)
    return result as ToolResult
  } catch (e) {
    console.error(`[tool:${name}] error`, e)
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export type { ToolDefinition, ToolExecutor, ToolResult }
