'use client';

import { AuroraBackground } from '@/components/ui/aurora-background';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <AuroraBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">FitAI Kontrol Paneli</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-bg-surface rounded-lg p-6 border border-border-default">
            <h2 className="text-lg font-semibold text-accent-primary mb-2">Bugünün Hazırlığı</h2>
            <p className="text-text-secondary text-2xl font-bold">--</p>
          </div>
          <div className="bg-bg-surface rounded-lg p-6 border border-border-default">
            <h2 className="text-lg font-semibold text-accent-energy mb-2">Bu Hafta Seanslar</h2>
            <p className="text-text-secondary text-2xl font-bold">0</p>
          </div>
          <div className="bg-bg-surface rounded-lg p-6 border border-border-default">
            <h2 className="text-lg font-semibold text-accent-recovery mb-2">Form Ortalaması</h2>
            <p className="text-text-secondary text-2xl font-bold">--</p>
          </div>
        </div>
      </div>
    </div>
  );
}
