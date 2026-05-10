export const subscriptions = [
  {
    name: 'Free',
    price: 0,
    period: 'sonsuza kadar',
    description: 'Tanışma için ideal.',
    features: [
      'Günde 30 mesaj',
      'Sistem karakterleri (Mia, Kerem, Selin, Ayşe)',
      'Temel hafıza',
      'Metin sohbet',
    ],
    cta: 'Ücretsiz Başla',
    highlight: false,
  },
  {
    name: 'Premium',
    price: 9.99,
    period: 'ay',
    yearly: 79,
    description: 'Tam deneyim. Karakterlerle gerçek bağ.',
    features: [
      'Sınırsız mesaj',
      'Tüm sistem karakterleri',
      'Sesli mesaj (iki yönlü)',
      'Kalıcı hafıza + zamanla derinleşen ilişki',
      'Ayda 500 kredi hediye',
      'Öncelikli destek',
    ],
    cta: 'Premium Ol',
    highlight: true,
  },
]

export const creditPacks = [
  {
    credits: 100,
    price: 4.99,
    label: 'Başlangıç',
    perCredit: 0.0499,
  },
  {
    credits: 500,
    price: 19.99,
    label: 'En Popüler',
    perCredit: 0.04,
    popular: true,
  },
  {
    credits: 1500,
    price: 49.99,
    label: 'Bonus Değer',
    perCredit: 0.0333,
    badge: '+10% bonus',
  },
  {
    credits: 5000,
    price: 149.99,
    label: 'Ultra',
    perCredit: 0.03,
    badge: '+20% bonus',
  },
]
