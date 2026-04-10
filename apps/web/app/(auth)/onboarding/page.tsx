'use client';

import { useState } from 'react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  const steps = [
    { title: 'Kişisel Bilgiler', desc: 'Ad, yaş, hedef' },
    { title: 'Sağlık & Yaralanmalar', desc: 'Sağlık sorunları, mevcut yaralanmalar' },
    { title: 'Fitness Seviyesi', desc: 'Deneyim ve mevcut kapasiten' },
    { title: 'Beden Taraması', desc: 'Kamera ile hareket analizi' },
    { title: 'Hedef Seçimi', desc: 'Kilo verme, kas kazanma, vb.' },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
      <div className="bg-bg-surface rounded-lg p-8 border border-border-default max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Hoş Geldin!</h1>
        <p className="text-text-secondary mb-6">Adım {step} / 5: {steps[step - 1].title}</p>
        <div className="mb-6 p-4 bg-bg-elevated rounded border border-border-subtle">
          <p className="text-text-muted">{steps[step - 1].desc}</p>
        </div>
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-2 px-4 bg-bg-elevated text-text-primary rounded hover:bg-border-default"
            >
              Geri
            </button>
          )}
          <button
            onClick={() => step < 5 && setStep(step + 1)}
            className="flex-1 py-2 px-4 bg-accent-primary text-white rounded hover:bg-accent-primary-hover"
          >
            {step === 5 ? 'Başla' : 'İleri'}
          </button>
        </div>
      </div>
    </div>
  );
}
