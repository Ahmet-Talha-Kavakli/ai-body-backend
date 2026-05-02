/**
 * Kan tahlili tool'ları (manuel giriş — fotoğraf v2'de).
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const bloodWorkToolDefs: ToolDefinition[] = [
  {
    name: 'add_blood_work_entry',
    category: 'bloodwork',
    description: 'Manuel kan tahlili sonucu kaydeder. Birden fazla değer aynı kayda eklenebilir.',
    parameters: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          description: 'Test adı + değer + birim',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'örn: LDL, HDL, Glikoz, TSH, Vitamin D' },
              value: { type: 'number' },
              unit: { type: 'string', description: 'örn: mg/dL, ng/mL' },
              referenceRange: { type: 'string', description: 'örn: <100, 70-99' },
            },
            required: ['name', 'value', 'unit'],
          },
        },
        date: { type: 'string', description: 'ISO date (varsayılan bugün)' },
        labName: { type: 'string', description: 'Laboratuvar adı (opsiyonel)' },
      },
      required: ['results'],
    },
  },
  {
    name: 'get_blood_work_history',
    category: 'bloodwork',
    description: 'Tüm kan tahlili kayıtlarını döner (en yeni önce).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_blood_work_metric_trend',
    category: 'bloodwork',
    description: 'Belirli bir kan testinin (örn. LDL) zaman içindeki trendini döner.',
    parameters: {
      type: 'object',
      properties: {
        metric: { type: 'string', description: 'Test adı, örn LDL' },
      },
      required: ['metric'],
    },
  },
]

interface BloodWorkResult {
  name: string
  value: number
  unit: string
  referenceRange?: string
}

export const bloodWorkExecutors: Record<string, ToolExecutor> = {
  add_blood_work_entry: {
    name: 'add_blood_work_entry',
    execute: async ({ userId, params }) => {
      const p = params as { results: BloodWorkResult[]; date?: string; labName?: string }
      const record = await db.bloodWorkRecord.create({
        data: {
          userId,
          results: {
            entries: p.results,
            labName: p.labName ?? null,
            date: p.date ?? new Date().toISOString(),
          } as object,
          analysis: { source: 'manual_via_assistant' } as object,
          uploadedAt: p.date ? new Date(p.date) : new Date(),
        },
      })
      return {
        ok: true,
        data: { recordId: record.id, count: p.results.length },
        display: {
          title: `${p.results.length} sonuç kaydedildi`,
          subtitle: p.results
            .slice(0, 3)
            .map((r) => `${r.name}: ${r.value}`)
            .join(' • '),
          icon: 'cross.case.fill',
          color: '#FF3B30',
        },
      } satisfies ToolResult
    },
  },
  get_blood_work_history: {
    name: 'get_blood_work_history',
    execute: async ({ userId }) => {
      const records = await db.bloodWorkRecord.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        take: 20,
        select: { id: true, results: true, uploadedAt: true },
      })
      const formatted = records.map((r) => {
        const data = r.results as { entries?: BloodWorkResult[]; labName?: string; date?: string }
        return {
          id: r.id,
          uploadedAt: r.uploadedAt.toISOString().slice(0, 10),
          labName: data.labName,
          tests: data.entries ?? [],
        }
      })
      return { ok: true, data: { records: formatted } } satisfies ToolResult
    },
  },
  get_blood_work_metric_trend: {
    name: 'get_blood_work_metric_trend',
    execute: async ({ userId, params }) => {
      const { metric } = params as { metric: string }
      const records = await db.bloodWorkRecord.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'asc' },
        select: { results: true, uploadedAt: true },
      })
      const points: Array<{ date: string; value: number; unit: string }> = []
      for (const r of records) {
        const data = r.results as { entries?: BloodWorkResult[] }
        const match = data.entries?.find((e) => e.name.toLowerCase().includes(metric.toLowerCase()))
        if (match) {
          points.push({
            date: r.uploadedAt.toISOString().slice(0, 10),
            value: match.value,
            unit: match.unit,
          })
        }
      }
      return {
        ok: true,
        data: {
          metric,
          points,
          count: points.length,
          ...(points.length >= 2
            ? {
                first: points[0]!.value,
                last: points[points.length - 1]!.value,
                change: +(points[points.length - 1]!.value - points[0]!.value).toFixed(2),
              }
            : {}),
        },
      } satisfies ToolResult
    },
  },
}
