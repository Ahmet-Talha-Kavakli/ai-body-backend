'use client'

import { useState } from 'react'
import { Plus, Trash2, Utensils } from 'lucide-react'
import { useMealTemplates } from '../../hooks/useMealTemplates'
import { NewTemplateModal } from './NewTemplateModal'

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Atıştırma',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

export function MealTemplates() {
  const { templates, loading, createTemplate, deleteTemplate } = useMealTemplates()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Öğün Şablonlarım</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#6366F1]/10 px-3 py-1.5 text-xs font-semibold text-[#6366F1] transition-colors hover:bg-[#6366F1]/20"
        >
          <Plus size={12} /> Yeni Şablon
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#64748B]">Yükleniyor...</div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Utensils size={24} className="text-[#64748B]" />
          <p className="text-sm text-[#64748B]">Henüz şablon yok</p>
          <p className="text-xs text-[#475569]">Sık yediğin öğünleri şablon olarak kaydet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {templates.map((tpl) => (
            <li
              key={tpl.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-white">{tpl.name}</p>
                <p className="text-xs text-[#64748B]">
                  {MEAL_TYPE_LABELS[tpl.mealType] ?? tpl.mealType} · {tpl.totalCalories} kcal
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">
                  P:{tpl.totalProteinG}g C:{tpl.totalCarbsG}g F:{tpl.totalFatG}g
                </span>
                <button
                  onClick={() => deleteTemplate(tpl.id)}
                  className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewTemplateModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={createTemplate}
      />
    </div>
  )
}
