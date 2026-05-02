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
import { hobbyToolDefs, hobbyExecutors } from './hobby'
import { sportsToolDefs, sportsExecutors } from './sports'

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
  ...hobbyToolDefs,
  ...sportsToolDefs,
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
  ...hobbyExecutors,
  ...sportsExecutors,
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
// OpenAI tools array max 128
const OPENAI_TOOLS_LIMIT = 128

// "all" durumunda gönderilecek varsayılan kategoriler — toplam max ~120 tool
// Tüm 18 kategori 183 tool'a çıkıyor, OpenAI 128'i kabul etmez.
const DEFAULT_HARD_CATEGORIES = [
  'health_read',
  'water',
  'sleep',
  'medication',
  'nutrition',
  'activity',
  'body',
  'mental',
  'tools',
  'bloodwork',
  'social',
  'reminder',
  'knowledge',
  'people',
  'environment',
]

export function getToolDefsForCategories(categories: string[] | 'all'): ToolDefinition[] {
  if (categories === 'all') {
    const defs = ALL_TOOL_DEFS.filter((t) => DEFAULT_HARD_CATEGORIES.includes(t.category))
    return defs.slice(0, OPENAI_TOOLS_LIMIT)
  }
  // Boş array → hiç tool gönderme (easy mesaj için tasarruf)
  if (categories.length === 0) return []

  // Sadece kullanıcı bir kategori istediğinde memory'i de ekle (recall için)
  // Always-on listesi sıkılaştırıldı: artık her medium'da memory + people gönderilmiyor
  const merged = new Set([...categories])

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
    finance: ['finance'],
    productivity: ['productivity'],
    career: ['career'],
    hobby: ['hobby'],
    sports: ['sports'],
    tools_actions: ['tools'],
  }

  const toolCats = new Set<string>()
  for (const c of merged) {
    const mapped = ROUTER_TO_TOOL_CAT[c] ?? [c]
    for (const m of mapped) toolCats.add(m)
  }

  return ALL_TOOL_DEFS.filter((t) => toolCats.has(t.category)).slice(0, OPENAI_TOOLS_LIMIT)
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
