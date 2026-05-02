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
import { financeToolDefs, financeExecutors } from './finance'
import { productivityToolDefs, productivityExecutors } from './productivity'
import { careerToolDefs, careerExecutors } from './career'

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
  ...financeToolDefs,
  ...productivityToolDefs,
  ...careerToolDefs,
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
  ...financeExecutors,
  ...productivityExecutors,
  ...careerExecutors,
}

/**
 * OpenAI Function calling formatına dönüştür.
 */
export function toOpenAIFunctions(defs: ToolDefinition[] = ALL_TOOL_DEFS) {
  return defs.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }))
}

/**
 * V2 Faz N: Router'ın seçtiği kategorilere göre tool subset.
 * "all" geçilirse tümü döner.
 *
 * Not: Bazı tool'lar kritik olduğu için her zaman dahil edilir (memory, people).
 */
export function getToolDefsForCategories(categories: string[] | 'all'): ToolDefinition[] {
  if (categories === 'all' || categories.length === 0) return ALL_TOOL_DEFS

  // Always-on tools (memory, people, mood — duygusal sürekli kullanılır)
  const ALWAYS_ON_CATEGORIES = ['memory', 'people', 'mood']
  const merged = new Set([...categories, ...ALWAYS_ON_CATEGORIES])

  // Bizim ToolCategory enum'u (types.ts) ile router kategorileri farklı isimde olabilir.
  // Mapping: router category → ToolCategory[]
  const ROUTER_TO_TOOL_CAT: Record<string, string[]> = {
    health: ['health_read'],
    water: ['water'],
    sleep: ['sleep'],
    medication: ['medication'],
    nutrition: ['nutrition'],
    activity: ['activity'],
    body: ['body'],
    mood: ['mental'],
    memory: ['knowledge'],
    people: ['people'],
    reminder: ['reminder'],
    environment: ['environment'],
    healthkit: ['health_read'],
    calendar: ['social'],
    contacts: ['social'],
    finance: ['tools'],
    productivity: ['tools'],
    career: ['tools'],
    tools_actions: ['tools'],
  }

  const toolCats = new Set<string>()
  for (const c of merged) {
    const mapped = ROUTER_TO_TOOL_CAT[c] ?? [c]
    for (const m of mapped) toolCats.add(m)
  }

  return ALL_TOOL_DEFS.filter((t) => toolCats.has(t.category))
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
