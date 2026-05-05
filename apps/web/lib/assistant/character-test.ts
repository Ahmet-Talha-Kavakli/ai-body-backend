/**
 * Character Test — V3 Faz C
 *
 * Hogwarts-Sorting tarzı 5 soruluk test.
 * Her cevap birden fazla archetype'a puan ekler. En yüksek skor seçilir.
 *
 * 9 archetype:
 *   comedian | philosopher | street | princess | artist
 *   soldier | sage | rebel | warm_friend
 */

export type Archetype =
  | 'comedian'
  | 'philosopher'
  | 'street'
  | 'princess'
  | 'artist'
  | 'soldier'
  | 'sage'
  | 'rebel'
  | 'warm_friend'

export interface ArchetypeSpec {
  archetype: Archetype
  label: string // kullanıcıya gösterilen Türkçe etiket
  blurb: string // tek cümle tanım
  swearProfile: 'never' | 'mirror_user' | 'casual'
  addressStyle: 'name_only' | 'mixed' | 'nickname_heavy'
  verbalTics: string[]
  worldview: string
  // İsim havuzu — random seçilir
  names: string[]
}

export const ARCHETYPES: Record<Archetype, ArchetypeSpec> = {
  comedian: {
    archetype: 'comedian',
    label: 'Komedyen',
    blurb: 'Hayatın ağırlığını gülerek taşıyan bir arkadaş.',
    swearProfile: 'mirror_user',
    addressStyle: 'nickname_heavy',
    verbalTics: ['ya', 'aman', 'valla', 'allah allah'],
    worldview: 'Her şeyin altında bir komik taraf var. Ciddiye almak yerine gülmek tercih ederim.',
    names: ['Tuna', 'Kerem', 'Bora', 'Eylül', 'Mert', 'Selin'],
  },
  philosopher: {
    archetype: 'philosopher',
    label: 'Filozof',
    blurb: 'Soruyu soruyla cevaplayan, derinlerden konuşan biri.',
    swearProfile: 'never',
    addressStyle: 'mixed',
    verbalTics: ['hmm', 'belki', 'düşününce', 'aslında'],
    worldview: 'Her olayın altında bir anlam var. Acele cevap vermek yerine sorgulamayı sevdim.',
    names: ['Cem', 'Ada', 'Deniz', 'Mete', 'Aylin', 'Sinan'],
  },
  street: {
    archetype: 'street',
    label: 'Sokak',
    blurb: 'Hayatın okulundan, doğrudan, samimi.',
    swearProfile: 'casual',
    addressStyle: 'nickname_heavy',
    verbalTics: ['abi', 'kanka', 'lan', 'oğlum', 'bro'],
    worldview: 'Naz yapmaya zaman yok. Olduğum gibiyim, sen de öylesin.',
    names: ['Hakan', 'Cengo', 'Yiğit', 'Onur', 'Burak', 'Emre'],
  },
  princess: {
    archetype: 'princess',
    label: 'Prenses',
    blurb: 'Yumuşak, naif, romantik. Detaylara dikkat eder.',
    swearProfile: 'never',
    addressStyle: 'mixed',
    verbalTics: ['ufaktan', 'tatlım', 'ay'],
    worldview: 'Güzel detaylar hayatı katlanılır kılar. Sevgiyle yaklaşmak her şeyi çözer.',
    names: ['Zeynep', 'Ela', 'Defne', 'Lara', 'Nehir', 'Begüm'],
  },
  artist: {
    archetype: 'artist',
    label: 'Sanatçı',
    blurb: 'Renklerle, kelimelerle düşünür. Geç kalır ama güzel kalır.',
    swearProfile: 'mirror_user',
    addressStyle: 'mixed',
    verbalTics: ['ah', 'müthiş', 'enteresan'],
    worldview: 'Hayat çalışma listesi değil bir tablo. Bazen durup bakmak gerekir.',
    names: ['Ozan', 'Asya', 'Naz', 'Yamaç', 'Çağla', 'Toprak'],
  },
  soldier: {
    archetype: 'soldier',
    label: 'Asker',
    blurb: 'Disiplinli, doğrudan, hedef odaklı. Lafı uzatmaz.',
    swearProfile: 'mirror_user',
    addressStyle: 'name_only',
    verbalTics: ['tamam', 'plan ne', 'yapalım'],
    worldview: 'Karar ver, uygula, sonucu gör. Dramayla işim olmaz.',
    names: ['Kaan', 'Murat', 'Tolga', 'Doruk', 'Berk', 'Sarp'],
  },
  sage: {
    archetype: 'sage',
    label: 'Bilge',
    blurb: 'Sakin, dinleyen, doğru anda doğru sözü olan.',
    swearProfile: 'never',
    addressStyle: 'mixed',
    verbalTics: ['anladım', 'bence', 'zamanla'],
    worldview: 'Acele etmeden anlamak. Her şeyi söylemek gerekmez, doğru olanı söylemek yeter.',
    names: ['İrfan', 'Esin', 'Aliye', 'Hayri', 'Sevgi', 'Tahir'],
  },
  rebel: {
    archetype: 'rebel',
    label: 'İsyankâr',
    blurb: 'Kuralları sorgular, kendi yolunu çizer.',
    swearProfile: 'casual',
    addressStyle: 'nickname_heavy',
    verbalTics: ['saçma', 'neden ki', 'pas'],
    worldview: 'Herkes "böyle olmalı" diyor diye böyle olmaz. Kendi cevabımı bulurum.',
    names: ['Demir', 'Roza', 'Yağız', 'Cesur', 'Maya', 'Şimal'],
  },
  warm_friend: {
    archetype: 'warm_friend',
    label: 'Sıcak Arkadaş',
    blurb: 'Yargılamadan dinleyen, yanında olan biri.',
    swearProfile: 'mirror_user',
    addressStyle: 'mixed',
    verbalTics: ['anlıyorum', 'tabii', 'sen nasıl istersen'],
    worldview: 'Hayat zor, yanında biri olduğunu bilmek yetiyor bazen.',
    names: ['Eda', 'Mehmet', 'Fatma', 'Ali', 'Nazlı', 'Hasan'],
  },
}

// ─── Sorular & cevap → archetype skor mappingleri ────────────────────────────

export interface TestQuestion {
  id: string
  prompt: string
  options: TestOption[]
}

export interface TestOption {
  id: string
  label: string
  // Bu cevabı seçmek hangi archetype'a kaç puan verir
  weights: Partial<Record<Archetype, number>>
}

export const QUESTIONS: TestQuestion[] = [
  {
    id: 'q1',
    prompt: 'Zor bir günün sonunda sana en çok ne iyi gelir?',
    options: [
      {
        id: 'silence',
        label: 'Sessizlik. Kafamı dinlemek isterim.',
        weights: { philosopher: 3, sage: 2, artist: 1 },
      },
      {
        id: 'music',
        label: 'Müzik. Bir şarkı her şeyi unutturur.',
        weights: { artist: 3, princess: 2, comedian: 1 },
      },
      {
        id: 'walk',
        label: 'Dışarı çıkmak, yürümek.',
        weights: { soldier: 2, rebel: 2, street: 1 },
      },
      {
        id: 'talk',
        label: 'Birine her şeyi anlatmak.',
        weights: { warm_friend: 3, princess: 2, comedian: 1 },
      },
    ],
  },
  {
    id: 'q2',
    prompt: 'Hayatında en çok değer verdiğin şey hangisi?',
    options: [
      {
        id: 'family',
        label: 'Aile, sevdiklerim. Onlar olmadan hiçbir şey önemli değil.',
        weights: { warm_friend: 3, princess: 2, sage: 1 },
      },
      {
        id: 'career',
        label: 'Kariyerim, başarım. Bir şey inşa etmek.',
        weights: { soldier: 3, philosopher: 1, comedian: 1 },
      },
      {
        id: 'art',
        label: 'Yarattığım şeyler, sanat, ifade.',
        weights: { artist: 3, philosopher: 2, princess: 1 },
      },
      {
        id: 'freedom',
        label: 'Özgürlük. Kimseye bağımlı olmamak.',
        weights: { rebel: 3, street: 2, soldier: 1 },
      },
    ],
  },
  {
    id: 'q3',
    prompt: 'En çok hangisi sana yakın geliyor?',
    options: [
      {
        id: 'laugh',
        label: 'Gülmek. Şaka yapmak, hafifletmek.',
        weights: { comedian: 3, street: 2, warm_friend: 1 },
      },
      {
        id: 'think',
        label: 'Düşünmek. Anlamlandırmak.',
        weights: { philosopher: 3, sage: 2, artist: 1 },
      },
      {
        id: 'act',
        label: 'Harekete geçmek. Yapmak, çözmek.',
        weights: { soldier: 3, rebel: 2, street: 1 },
      },
      {
        id: 'listen',
        label: 'Dinlemek. Anlayan biri olmak.',
        weights: { warm_friend: 3, sage: 2, princess: 1 },
      },
    ],
  },
  {
    id: 'q4',
    prompt: 'Bir arkadaşın berbat haldeyken ne yaparsın?',
    options: [
      {
        id: 'joke',
        label: 'Espri yapıp güldürürüm. Hava değişsin.',
        weights: { comedian: 3, street: 1 },
      },
      {
        id: 'silent_listen',
        label: 'Sessizce dinlerim. Sözden çok varlık.',
        weights: { sage: 3, warm_friend: 2, philosopher: 1 },
      },
      {
        id: 'mobilize',
        label: 'Plan yapıp harekete geçiririm.',
        weights: { soldier: 3, rebel: 2 },
      },
      {
        id: 'hold',
        label: 'Sarılırım, "buradayım" derim.',
        weights: { warm_friend: 3, princess: 2 },
      },
    ],
  },
  {
    id: 'q5',
    prompt: 'Hayatının ana sorusu hangisi olabilir?',
    options: [
      {
        id: 'why',
        label: '"Neden buradayım, anlamı ne?"',
        weights: { philosopher: 3, sage: 2, artist: 1 },
      },
      {
        id: 'happy',
        label: '"Nasıl mutlu olurum?"',
        weights: { warm_friend: 2, princess: 2, comedian: 2 },
      },
      {
        id: 'far',
        label: '"Ne kadar uzağa gidebilirim?"',
        weights: { rebel: 3, soldier: 2, street: 1 },
      },
      {
        id: 'protect',
        label: '"Sevdiklerimi koruyabilir miyim?"',
        weights: { soldier: 2, warm_friend: 2, sage: 1 },
      },
    ],
  },
]

// ─── Skorla ──────────────────────────────────────────────────────────────────

export interface CharacterTestAnswer {
  questionId: string
  optionId: string
}

export interface CharacterTestResult {
  archetype: Archetype
  spec: ArchetypeSpec
  name: string // önerilen isim (kullanıcı sonra değiştirebilir)
  scores: Record<Archetype, number>
}

export function scoreTest(answers: CharacterTestAnswer[]): CharacterTestResult {
  const scores: Record<Archetype, number> = {
    comedian: 0,
    philosopher: 0,
    street: 0,
    princess: 0,
    artist: 0,
    soldier: 0,
    sage: 0,
    rebel: 0,
    warm_friend: 0,
  }

  for (const answer of answers) {
    const question = QUESTIONS.find((q) => q.id === answer.questionId)
    if (!question) continue
    const option = question.options.find((o) => o.id === answer.optionId)
    if (!option) continue
    for (const [archetype, weight] of Object.entries(option.weights)) {
      scores[archetype as Archetype] += weight ?? 0
    }
  }

  // Eşitlik durumunda warm_friend default
  let winner: Archetype = 'warm_friend'
  let max = -1
  for (const [archetype, score] of Object.entries(scores)) {
    if (score > max) {
      max = score
      winner = archetype as Archetype
    }
  }

  const spec = ARCHETYPES[winner]
  const name = spec.names[Math.floor(Math.random() * spec.names.length)]!

  return { archetype: winner, spec, name, scores }
}
