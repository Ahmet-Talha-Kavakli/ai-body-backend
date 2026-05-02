/**
 * Para & Finans tool'ları (V2 Faz N).
 * Transaction (gelir/gider), Subscription, Bill, Goal, Account.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

const CATEGORY = 'tools' as const

// Kullanıcının hangi para birimini default kabul ettiğini bul (varsa)
async function defaultCurrency(userId: string): Promise<string> {
  const acc = await db.financialAccount.findFirst({
    where: { userId, archived: false, isPrimary: true },
    select: { currency: true },
  })
  return acc?.currency ?? 'TRY'
}

export const financeToolDefs: ToolDefinition[] = [
  // ── TRANSACTIONS ──
  {
    name: 'log_expense',
    category: CATEGORY,
    description:
      'Bir gider kaydı oluştur. Kullanıcı "$40 yemek harcadım", "akşam Mikla 800 TL" gibi söylediğinde kullan. Tarih belirsizse bugün varsay.',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        currency: { type: 'string', description: 'TRY, USD, EUR vb. Default: kullanıcı default.' },
        category: {
          type: 'string',
          enum: [
            'yemek',
            'ulaşım',
            'abonelik',
            'kira',
            'eğlence',
            'sağlık',
            'alışveriş',
            'fatura',
            'eğitim',
            'spor',
            'seyahat',
            'hediye',
            'diğer',
          ],
        },
        merchant: { type: 'string', description: 'Mağaza/restoran adı (varsa)' },
        note: { type: 'string' },
        dateISO: { type: 'string', description: 'ISO tarih, default bugün' },
      },
      required: ['amount', 'category'],
    },
  },
  {
    name: 'log_income',
    category: CATEGORY,
    description: 'Bir gelir kaydı (maaş, freelance, hediye, kira, satış vb.).',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        currency: { type: 'string' },
        category: {
          type: 'string',
          enum: ['maaş', 'freelance', 'hediye', 'kira_geliri', 'satış', 'temettü', 'iade', 'diğer'],
        },
        source: { type: 'string', description: 'Kim/hangi kaynak' },
        note: { type: 'string' },
        dateISO: { type: 'string' },
      },
      required: ['amount', 'category'],
    },
  },
  {
    name: 'list_recent_transactions',
    category: CATEGORY,
    description: 'Son N işlemi listeler. "Son harcamalarım", "bu hafta ne yaptım" gibi.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 7 },
        type: { type: 'string', enum: ['expense', 'income', 'all'], default: 'all' },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    name: 'get_spending_summary',
    category: CATEGORY,
    description:
      'Belirli aralıkta kategori bazlı toplam harcama. "Bu ay ne kadar harcadım?", "Yemek ne kadar?" gibi.',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month', 'year'], default: 'month' },
      },
    },
  },
  {
    name: 'search_transactions',
    category: CATEGORY,
    description:
      "Merchant, kategori veya nota göre işlem ara. 'Mikla'da kaç para yedim', 'kahve harcamalarım'.",
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        days: { type: 'number', default: 90 },
      },
      required: ['query'],
    },
  },
  {
    name: 'delete_transaction',
    category: CATEGORY,
    description: 'Bir işlemi sil. transactionId list_recent veya search çıktısından.',
    parameters: {
      type: 'object',
      properties: {
        transactionId: { type: 'string' },
      },
      required: ['transactionId'],
    },
    destructive: true,
  },

  // ── SUBSCRIPTIONS ──
  {
    name: 'add_subscription',
    category: CATEGORY,
    description: "Bir aylık/yıllık abonelik ekle. 'Spotify 14.99 USD aylık', 'gym yıllık 4500 TL'.",
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        billingPeriod: {
          type: 'string',
          enum: ['monthly', 'yearly', 'weekly', 'quarterly'],
          default: 'monthly',
        },
        category: {
          type: 'string',
          enum: ['streaming', 'software', 'fitness', 'news', 'gym', 'cloud', 'education', 'other'],
        },
        nextChargeISO: { type: 'string' },
      },
      required: ['name', 'amount'],
    },
  },
  {
    name: 'list_subscriptions',
    category: CATEGORY,
    description:
      'Aktif abonelikleri listeler ve aylık toplam tutarı verir. "Aboneliklerim", "ne kadar veriyorum aboneliklere?"',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'cancel_subscription',
    category: CATEGORY,
    description: 'Bir aboneliği iptal et işaretle. subscriptionId listeden.',
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string' },
      },
      required: ['subscriptionId'],
    },
    destructive: true,
  },

  // ── BILLS ──
  {
    name: 'add_bill',
    category: CATEGORY,
    description: "Düzenli bir fatura kaydet. 'Elektrik faturası ayın 15'i, ortalama 600 TL'.",
    parameters: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        category: {
          type: 'string',
          enum: [
            'electricity',
            'water',
            'gas',
            'internet',
            'phone',
            'rent',
            'insurance',
            'credit_card',
            'other',
          ],
        },
        dueDay: { type: 'number', description: 'Ayın hangi günü (1-31)' },
        period: {
          type: 'string',
          enum: ['monthly', 'quarterly', 'yearly'],
          default: 'monthly',
        },
        autoCharge: { type: 'boolean', default: false },
      },
      required: ['label', 'category'],
    },
  },
  {
    name: 'list_bills',
    category: CATEGORY,
    description: 'Aktif faturaları ve yaklaşan ödemeleri listeler.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'mark_bill_paid',
    category: CATEGORY,
    description:
      "Bir faturayı 'ödendi' işaretle ve otomatik bir gider kaydı oluştur. billId listeden.",
    parameters: {
      type: 'object',
      properties: {
        billId: { type: 'string' },
        amount: { type: 'number', description: 'Bu seferki ödenen tutar (varsa)' },
      },
      required: ['billId'],
    },
  },

  // ── GOALS ──
  {
    name: 'set_financial_goal',
    category: CATEGORY,
    description:
      "Birikim/finansal hedef ekle. 'Ev için 40.000 USD', 'tatil için 5000 TL Aralığa kadar'.",
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        targetAmount: { type: 'number' },
        currency: { type: 'string' },
        deadlineISO: { type: 'string' },
        category: {
          type: 'string',
          enum: ['ev', 'araba', 'tatil', 'acil_fon', 'emeklilik', 'eğitim', 'diğer'],
        },
        currentAmount: { type: 'number', default: 0 },
      },
      required: ['title', 'targetAmount'],
    },
  },
  {
    name: 'list_financial_goals',
    category: CATEGORY,
    description: 'Aktif finansal hedefleri ve ilerleme yüzdelerini listeler.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'update_goal_progress',
    category: CATEGORY,
    description: 'Bir hedefe ne kadar biriktirildiğini güncelle. delta veya newAmount kullan.',
    parameters: {
      type: 'object',
      properties: {
        goalId: { type: 'string' },
        delta: { type: 'number', description: 'Eklenen/çıkarılan miktar (+/-)' },
        newAmount: { type: 'number', description: 'Direkt yeni toplam (delta yerine)' },
      },
      required: ['goalId'],
    },
  },

  // ── ACCOUNTS ──
  {
    name: 'add_financial_account',
    category: CATEGORY,
    description: "Banka/cüzdan/kart ekle. 'Garanti vadesiz hesabım 12000 TL', 'Binance USDT 200'.",
    parameters: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        type: {
          type: 'string',
          enum: ['checking', 'savings', 'credit_card', 'wallet', 'investment', 'crypto'],
        },
        currency: { type: 'string' },
        balance: { type: 'number', default: 0 },
        isPrimary: { type: 'boolean', default: false },
      },
      required: ['label', 'type'],
    },
  },
  {
    name: 'list_financial_accounts',
    category: CATEGORY,
    description: 'Tüm hesapları para birimine göre toplam servet ile birlikte listeler.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'update_account_balance',
    category: CATEGORY,
    description: 'Bir hesabın bakiyesini güncelle. accountId listeden.',
    parameters: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
        newBalance: { type: 'number' },
      },
      required: ['accountId', 'newBalance'],
    },
  },
]

// ────────────────────────────────────────────────────
// EXECUTORS
// ────────────────────────────────────────────────────

export const financeExecutors: Record<string, ToolExecutor> = {
  log_expense: {
    name: 'log_expense',
    execute: async ({ userId, params }) => {
      const p = params as {
        amount: number
        currency?: string
        category: string
        merchant?: string
        note?: string
        dateISO?: string
      }
      const tx = await db.transaction.create({
        data: {
          userId,
          type: 'expense',
          amount: p.amount,
          currency: p.currency ?? (await defaultCurrency(userId)),
          category: p.category,
          merchant: p.merchant,
          note: p.note,
          date: p.dateISO ? new Date(p.dateISO) : new Date(),
        },
      })
      return {
        ok: true,
        data: tx,
        display: {
          title: `${p.amount} ${tx.currency} gider`,
          subtitle: p.merchant ? `${p.merchant} • ${p.category}` : p.category,
          icon: 'arrow.up.right.circle.fill',
          color: '#FF453A',
          undoable: true,
          undoToolCall: { name: 'delete_transaction', params: { transactionId: tx.id } },
        },
      } satisfies ToolResult
    },
  },

  log_income: {
    name: 'log_income',
    execute: async ({ userId, params }) => {
      const p = params as {
        amount: number
        currency?: string
        category: string
        source?: string
        note?: string
        dateISO?: string
      }
      const tx = await db.transaction.create({
        data: {
          userId,
          type: 'income',
          amount: p.amount,
          currency: p.currency ?? (await defaultCurrency(userId)),
          category: p.category,
          merchant: p.source,
          note: p.note,
          date: p.dateISO ? new Date(p.dateISO) : new Date(),
        },
      })
      return {
        ok: true,
        data: tx,
        display: {
          title: `${p.amount} ${tx.currency} gelir`,
          subtitle: p.source ? `${p.source} • ${p.category}` : p.category,
          icon: 'arrow.down.left.circle.fill',
          color: '#30D158',
          undoable: true,
          undoToolCall: { name: 'delete_transaction', params: { transactionId: tx.id } },
        },
      } satisfies ToolResult
    },
  },

  list_recent_transactions: {
    name: 'list_recent_transactions',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number; type?: string; limit?: number }
      const days = p?.days ?? 7
      const limit = Math.min(p?.limit ?? 20, 100)
      const since = new Date()
      since.setDate(since.getDate() - days)
      const where: Record<string, unknown> = { userId, date: { gte: since } }
      if (p?.type && p.type !== 'all') where.type = p.type
      const txs = await db.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
      })
      return {
        ok: true,
        data: { transactions: txs, days, count: txs.length },
        display: {
          title: `Son ${days} gün`,
          subtitle: `${txs.length} işlem`,
          icon: 'list.bullet.rectangle',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  get_spending_summary: {
    name: 'get_spending_summary',
    execute: async ({ userId, params }) => {
      const p = params as { period?: string }
      const period = p?.period ?? 'month'
      const since = new Date()
      if (period === 'week') since.setDate(since.getDate() - 7)
      else if (period === 'year') since.setFullYear(since.getFullYear() - 1)
      else since.setMonth(since.getMonth() - 1)

      const txs = await db.transaction.findMany({
        where: { userId, type: 'expense', date: { gte: since } },
        select: { amount: true, category: true, currency: true },
      })

      const byCategory: Record<string, { total: number; count: number; currency: string }> = {}
      let total = 0
      const currencyAgg: Record<string, number> = {}
      for (const t of txs) {
        currencyAgg[t.currency] = (currencyAgg[t.currency] ?? 0) + t.amount
        total += t.amount
        const k = t.category
        if (!byCategory[k]) byCategory[k] = { total: 0, count: 0, currency: t.currency }
        byCategory[k].total += t.amount
        byCategory[k].count += 1
      }
      const sorted = Object.entries(byCategory)
        .map(([category, v]) => ({ category, ...v }))
        .sort((a, b) => b.total - a.total)

      const primaryCurrency =
        Object.entries(currencyAgg).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'TRY'

      return {
        ok: true,
        data: {
          period,
          total,
          currencyAgg,
          primaryCurrency,
          byCategory: sorted,
          txCount: txs.length,
        },
        display: {
          title: `${period} özeti`,
          subtitle: `${total.toFixed(0)} ${primaryCurrency}`,
          icon: 'chart.pie.fill',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  search_transactions: {
    name: 'search_transactions',
    execute: async ({ userId, params }) => {
      const p = params as { query: string; days?: number }
      const days = p?.days ?? 90
      const since = new Date()
      since.setDate(since.getDate() - days)
      const txs = await db.transaction.findMany({
        where: {
          userId,
          date: { gte: since },
          OR: [
            { merchant: { contains: p.query, mode: 'insensitive' } },
            { category: { contains: p.query, mode: 'insensitive' } },
            { note: { contains: p.query, mode: 'insensitive' } },
          ],
        },
        orderBy: { date: 'desc' },
        take: 50,
      })
      const total = txs.reduce((acc, t) => acc + t.amount, 0)
      return {
        ok: true,
        data: { transactions: txs, total, count: txs.length, query: p.query },
        display: {
          title: `"${p.query}"`,
          subtitle: `${txs.length} işlem • ${total.toFixed(0)}`,
          icon: 'magnifyingglass',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  delete_transaction: {
    name: 'delete_transaction',
    execute: async ({ userId, params }) => {
      const { transactionId } = params as { transactionId: string }
      const tx = await db.transaction.findFirst({ where: { id: transactionId, userId } })
      if (!tx) return { ok: false, error: 'not_found' }
      await db.transaction.delete({ where: { id: transactionId } })
      return {
        ok: true,
        display: {
          title: 'İşlem silindi',
          subtitle: `${tx.amount} ${tx.currency} • ${tx.category}`,
          icon: 'trash',
          color: '#8E8E93',
        },
      } satisfies ToolResult
    },
  },

  add_subscription: {
    name: 'add_subscription',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        amount: number
        currency?: string
        billingPeriod?: string
        category?: string
        nextChargeISO?: string
      }
      const sub = await db.financeSubscription.create({
        data: {
          userId,
          name: p.name,
          amount: p.amount,
          currency: p.currency ?? (await defaultCurrency(userId)),
          billingPeriod: p.billingPeriod ?? 'monthly',
          category: p.category,
          nextChargeAt: p.nextChargeISO ? new Date(p.nextChargeISO) : null,
          startedAt: new Date(),
        },
      })
      return {
        ok: true,
        data: sub,
        display: {
          title: `${p.name} eklendi`,
          subtitle: `${p.amount} ${sub.currency}/${p.billingPeriod ?? 'ay'}`,
          icon: 'arrow.triangle.2.circlepath',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },

  list_subscriptions: {
    name: 'list_subscriptions',
    execute: async ({ userId }) => {
      const subs = await db.financeSubscription.findMany({
        where: { userId, cancelled: false },
        orderBy: [{ amount: 'desc' }],
      })
      // Aylık eşdeğer toplam (basit: yearly /12, weekly *4, quarterly /3)
      const monthlyByCurrency: Record<string, number> = {}
      for (const s of subs) {
        let m = s.amount
        if (s.billingPeriod === 'yearly') m = s.amount / 12
        else if (s.billingPeriod === 'weekly') m = s.amount * 4
        else if (s.billingPeriod === 'quarterly') m = s.amount / 3
        monthlyByCurrency[s.currency] = (monthlyByCurrency[s.currency] ?? 0) + m
      }
      return {
        ok: true,
        data: { subscriptions: subs, monthlyByCurrency, count: subs.length },
        display: {
          title: 'Abonelikler',
          subtitle: `${subs.length} aktif`,
          icon: 'arrow.triangle.2.circlepath',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },

  cancel_subscription: {
    name: 'cancel_subscription',
    execute: async ({ userId, params }) => {
      const { subscriptionId } = params as { subscriptionId: string }
      const sub = await db.financeSubscription.findFirst({ where: { id: subscriptionId, userId } })
      if (!sub) return { ok: false, error: 'not_found' }
      const updated = await db.financeSubscription.update({
        where: { id: subscriptionId },
        data: { cancelled: true, cancelledAt: new Date() },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: `${sub.name} iptal edildi`,
          subtitle: `Aylık ~${sub.amount} ${sub.currency} kazanç`,
          icon: 'xmark.circle',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  add_bill: {
    name: 'add_bill',
    execute: async ({ userId, params }) => {
      const p = params as {
        label: string
        amount?: number
        currency?: string
        category: string
        dueDay?: number
        period?: string
        autoCharge?: boolean
      }
      const bill = await db.bill.create({
        data: {
          userId,
          label: p.label,
          amount: p.amount,
          currency: p.currency ?? (await defaultCurrency(userId)),
          category: p.category,
          dueDay: p.dueDay,
          period: p.period ?? 'monthly',
          autoCharge: p.autoCharge ?? false,
        },
      })
      return {
        ok: true,
        data: bill,
        display: {
          title: `${p.label} eklendi`,
          subtitle: p.dueDay ? `Her ayın ${p.dueDay}'i` : p.category,
          icon: 'doc.text.fill',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  list_bills: {
    name: 'list_bills',
    execute: async ({ userId }) => {
      const bills = await db.bill.findMany({
        where: { userId, archived: false },
        orderBy: [{ dueDay: 'asc' }],
      })
      return {
        ok: true,
        data: { bills, count: bills.length },
        display: {
          title: 'Faturalar',
          subtitle: `${bills.length} aktif`,
          icon: 'doc.text.fill',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  mark_bill_paid: {
    name: 'mark_bill_paid',
    execute: async ({ userId, params }) => {
      const p = params as { billId: string; amount?: number }
      const bill = await db.bill.findFirst({ where: { id: p.billId, userId } })
      if (!bill) return { ok: false, error: 'not_found' }
      const amount = p.amount ?? bill.amount ?? 0
      await db.bill.update({
        where: { id: p.billId },
        data: { lastPaidAt: new Date() },
      })
      // Otomatik gider kaydı
      const tx = await db.transaction.create({
        data: {
          userId,
          type: 'expense',
          amount,
          currency: bill.currency,
          category: 'fatura',
          merchant: bill.label,
          note: `${bill.label} ödemesi`,
          date: new Date(),
        },
      })
      return {
        ok: true,
        data: { bill, transaction: tx },
        display: {
          title: `${bill.label} ödendi`,
          subtitle: `${amount} ${bill.currency} gider kaydı oluşturuldu`,
          icon: 'checkmark.circle.fill',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },

  set_financial_goal: {
    name: 'set_financial_goal',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        targetAmount: number
        currency?: string
        deadlineISO?: string
        category?: string
        currentAmount?: number
      }
      let monthlyTarget: number | null = null
      if (p.deadlineISO) {
        const months = Math.max(
          1,
          Math.round((new Date(p.deadlineISO).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000))
        )
        const remaining = p.targetAmount - (p.currentAmount ?? 0)
        monthlyTarget = remaining / months
      }
      const goal = await db.financialGoal.create({
        data: {
          userId,
          title: p.title,
          targetAmount: p.targetAmount,
          currentAmount: p.currentAmount ?? 0,
          currency: p.currency ?? (await defaultCurrency(userId)),
          deadline: p.deadlineISO ? new Date(p.deadlineISO) : null,
          monthlyTarget,
          category: p.category,
        },
      })
      return {
        ok: true,
        data: goal,
        display: {
          title: `${p.title} hedefi`,
          subtitle: monthlyTarget
            ? `Aylık ${monthlyTarget.toFixed(0)} ${goal.currency} gerekli`
            : `${p.targetAmount} ${goal.currency}`,
          icon: 'flag.fill',
          color: '#34C759',
        },
      } satisfies ToolResult
    },
  },

  list_financial_goals: {
    name: 'list_financial_goals',
    execute: async ({ userId }) => {
      const goals = await db.financialGoal.findMany({
        where: { userId, archived: false },
        orderBy: [{ achieved: 'asc' }, { deadline: 'asc' }],
      })
      const enriched = goals.map((g) => ({
        ...g,
        progressPct: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
        remaining: g.targetAmount - g.currentAmount,
      }))
      return {
        ok: true,
        data: { goals: enriched, count: enriched.length },
        display: {
          title: 'Hedefler',
          subtitle: `${enriched.length} aktif`,
          icon: 'flag.fill',
          color: '#34C759',
        },
      } satisfies ToolResult
    },
  },

  update_goal_progress: {
    name: 'update_goal_progress',
    execute: async ({ userId, params }) => {
      const p = params as { goalId: string; delta?: number; newAmount?: number }
      const goal = await db.financialGoal.findFirst({ where: { id: p.goalId, userId } })
      if (!goal) return { ok: false, error: 'not_found' }
      const newAmount = p.newAmount != null ? p.newAmount : goal.currentAmount + (p.delta ?? 0)
      const achieved = newAmount >= goal.targetAmount
      const updated = await db.financialGoal.update({
        where: { id: p.goalId },
        data: {
          currentAmount: newAmount,
          achieved,
          achievedAt: achieved ? new Date() : null,
        },
      })
      const pct = goal.targetAmount > 0 ? (newAmount / goal.targetAmount) * 100 : 0
      return {
        ok: true,
        data: updated,
        display: {
          title: `${goal.title} güncellendi`,
          subtitle: `${pct.toFixed(0)}% (${newAmount.toFixed(0)}/${goal.targetAmount.toFixed(0)})`,
          icon: achieved ? 'checkmark.seal.fill' : 'flag.fill',
          color: achieved ? '#FFD60A' : '#34C759',
        },
      } satisfies ToolResult
    },
  },

  add_financial_account: {
    name: 'add_financial_account',
    execute: async ({ userId, params }) => {
      const p = params as {
        label: string
        type: string
        currency?: string
        balance?: number
        isPrimary?: boolean
      }
      if (p.isPrimary) {
        await db.financialAccount.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        })
      }
      const acc = await db.financialAccount.create({
        data: {
          userId,
          label: p.label,
          type: p.type,
          currency: p.currency ?? 'TRY',
          balance: p.balance ?? 0,
          isPrimary: p.isPrimary ?? false,
        },
      })
      return {
        ok: true,
        data: acc,
        display: {
          title: `${p.label} eklendi`,
          subtitle: `${acc.balance.toFixed(0)} ${acc.currency}`,
          icon: 'creditcard.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  list_financial_accounts: {
    name: 'list_financial_accounts',
    execute: async ({ userId }) => {
      const accs = await db.financialAccount.findMany({
        where: { userId, archived: false },
        orderBy: [{ isPrimary: 'desc' }, { balance: 'desc' }],
      })
      const totalsByCurrency: Record<string, number> = {}
      for (const a of accs) {
        totalsByCurrency[a.currency] = (totalsByCurrency[a.currency] ?? 0) + a.balance
      }
      return {
        ok: true,
        data: { accounts: accs, totalsByCurrency, count: accs.length },
        display: {
          title: 'Hesaplar',
          subtitle: `${accs.length} hesap`,
          icon: 'creditcard.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  update_account_balance: {
    name: 'update_account_balance',
    execute: async ({ userId, params }) => {
      const p = params as { accountId: string; newBalance: number }
      const acc = await db.financialAccount.findFirst({ where: { id: p.accountId, userId } })
      if (!acc) return { ok: false, error: 'not_found' }
      const updated = await db.financialAccount.update({
        where: { id: p.accountId },
        data: { balance: p.newBalance },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: `${acc.label} güncellendi`,
          subtitle: `${p.newBalance.toFixed(0)} ${acc.currency}`,
          icon: 'pencil',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
}
