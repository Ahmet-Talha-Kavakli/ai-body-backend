/**
 * Maps supplement names to their icon files.
 * Icons are in assets/icons/supplements/
 * Usage: const icon = getSupplementIcon(supplement.name);
 *        <Image source={icon} />
 */

const icons = {
  // === PROTEIN ===
  'whey-protein': require('../assets/icons/supplements/whey-protein.png'),
  'whey-protein-white': require('../assets/icons/supplements/whey-protein-white.png'),
  'pea-protein': require('../assets/icons/supplements/pea-protein.png'),
  'soy-protein': require('../assets/icons/supplements/soy-protein.png'),
  'pea-rice-protein': require('../assets/icons/supplements/pea-rice-protein.png'),
  'collagen-powder': require('../assets/icons/supplements/collagen-powder.png'),

  // === CREATINE ===
  'creatine-monohydrate': require('../assets/icons/supplements/creatine-monohydrate.png'),
  'creatine-white': require('../assets/icons/supplements/creatine-white.png'),

  // === AMINO ACIDS ===
  bcaa: require('../assets/icons/supplements/bcaa.png'),
  citrulline: require('../assets/icons/supplements/citrulline.png'),
  beetroot: require('../assets/icons/supplements/beetroot.png'),
  'amino-acid': require('../assets/icons/supplements/amino-acid.png'),
  taurine: require('../assets/icons/supplements/taurine.png'),

  // === VITAMINS ===
  'vitamin-c': require('../assets/icons/supplements/vitamin-c.png'),
  'vitamin-c-orange': require('../assets/icons/supplements/vitamin-c-orange.png'),
  'vitamin-tablet': require('../assets/icons/supplements/vitamin-tablet.png'),
  multivitamin: require('../assets/icons/supplements/multivitamin.png'),
  'vitamin-b': require('../assets/icons/supplements/vitamin-b.png'),
  potassium: require('../assets/icons/supplements/potassium.png'),

  // === MINERALS ===
  magnesium: require('../assets/icons/supplements/magnesium.png'),
  iron: require('../assets/icons/supplements/iron.png'),
  'mineral-crystal': require('../assets/icons/supplements/mineral-crystal.png'),
  'calcium-bone': require('../assets/icons/supplements/calcium-bone.png'),
  glucosamine: require('../assets/icons/supplements/glucosamine.png'),
  'white-powder': require('../assets/icons/supplements/white-powder.png'),

  // === OMEGA / OILS ===
  'fish-oil': require('../assets/icons/supplements/fish-oil.png'),
  'mct-oil': require('../assets/icons/supplements/mct-oil.png'),
  'evening-primrose': require('../assets/icons/supplements/evening-primrose.png'),
  'evening-primrose-flower': require('../assets/icons/supplements/evening-primrose-flower.png'),
  'coq10-heart': require('../assets/icons/supplements/coq10-heart.png'),
  ubiquinol: require('../assets/icons/supplements/ubiquinol.png'),
  'olive-oil': require('../assets/icons/supplements/olive-oil.png'),
  'amber-oil-bottle': require('../assets/icons/supplements/amber-oil-bottle.png'),

  // === PROBIOTICS ===
  probiotic: require('../assets/icons/supplements/probiotic.png'),
  'probiotic-yogurt': require('../assets/icons/supplements/probiotic-yogurt.png'),

  // === HERBS & ADAPTOGENS ===
  ashwagandha: require('../assets/icons/supplements/ashwagandha.png'),
  'ashwagandha-root': require('../assets/icons/supplements/ashwagandha-root.png'),
  cinnamon: require('../assets/icons/supplements/cinnamon.png'),
  'aloe-vera': require('../assets/icons/supplements/aloe-vera.png'),
  saffron: require('../assets/icons/supplements/saffron.png'),
  cordyceps: require('../assets/icons/supplements/cordyceps.png'),
  'mucuna-pruriens': require('../assets/icons/supplements/mucuna-pruriens.png'),
  'cayenne-pepper': require('../assets/icons/supplements/cayenne-pepper.png'),
  'garcinia-cambogia': require('../assets/icons/supplements/garcinia-cambogia.png'),
  'maca-root': require('../assets/icons/supplements/maca-root.png'),
  'maca-powder': require('../assets/icons/supplements/maca-powder.png'),
  'green-coffee': require('../assets/icons/supplements/green-coffee.png'),
  'holy-basil': require('../assets/icons/supplements/holy-basil.png'),
  pycnogenol: require('../assets/icons/supplements/pycnogenol.png'),
  boswellia: require('../assets/icons/supplements/boswellia.png'),
  'black-seed-oil': require('../assets/icons/supplements/black-seed-oil.png'),
  artichoke: require('../assets/icons/supplements/artichoke.png'),
  'holy-basil-leaf': require('../assets/icons/supplements/holy-basil-leaf.png'),
  'african-mango': require('../assets/icons/supplements/african-mango.png'),
  wheatgrass: require('../assets/icons/supplements/wheatgrass.png'),
  'white-kidney-bean': require('../assets/icons/supplements/white-kidney-bean.png'),

  // === ANTIOXIDANTS / FRUITS ===
  pomegranate: require('../assets/icons/supplements/pomegranate.png'),
  blueberry: require('../assets/icons/supplements/blueberry.png'),
  'tart-cherry': require('../assets/icons/supplements/tart-cherry.png'),
  'acai-berry': require('../assets/icons/supplements/acai-berry.png'),
  elderberry: require('../assets/icons/supplements/elderberry.png'),
  bilberry: require('../assets/icons/supplements/bilberry.png'),
  'grape-seed': require('../assets/icons/supplements/grape-seed.png'),
  'lycopene-tomato': require('../assets/icons/supplements/lycopene-tomato.png'),
  'lutein-marigold': require('../assets/icons/supplements/lutein-marigold.png'),
  spirulina: require('../assets/icons/supplements/spirulina.png'),
  schisandra: require('../assets/icons/supplements/schisandra.png'),
  astaxanthin: require('../assets/icons/supplements/astaxanthin.png'),
  'sulforaphane-broccoli': require('../assets/icons/supplements/sulforaphane-broccoli.png'),
  'bromelain-pineapple': require('../assets/icons/supplements/bromelain-pineapple.png'),

  // === SLEEP / BRAIN ===
  'nootropic-brain': require('../assets/icons/supplements/nootropic-brain.png'),
  'nootropic-circuit': require('../assets/icons/supplements/nootropic-circuit.png'),
  'chamomile-flower': require('../assets/icons/supplements/chamomile-flower.png'),

  // === COLLAGEN / SKIN ===
  'collagen-dissolve': require('../assets/icons/supplements/collagen-dissolve.png'),
  'collagen-capsule': require('../assets/icons/supplements/collagen-capsule.png'),
  'collagen-cream': require('../assets/icons/supplements/collagen-cream.png'),
  'collagen-gold': require('../assets/icons/supplements/collagen-gold.png'),

  // === PRE-WORKOUT / CAFFEINE ===
  caffeine: require('../assets/icons/supplements/caffeine.png'),
  'pre-workout': require('../assets/icons/supplements/pre-workout.png'),
  'pre-workout-red': require('../assets/icons/supplements/pre-workout-red.png'),

  // === GENERIC CAPSULES ===
  'capsule-blue-white': require('../assets/icons/supplements/capsule-blue-white.png'),
  'capsule-blue-white-2': require('../assets/icons/supplements/capsule-blue-white-2.png'),
  'capsule-blue-soft': require('../assets/icons/supplements/capsule-blue-soft.png'),
  'capsule-purple-white': require('../assets/icons/supplements/capsule-purple-white.png'),
  'capsule-lavender': require('../assets/icons/supplements/capsule-lavender.png'),
  'capsule-purple-white-2': require('../assets/icons/supplements/capsule-purple-white-2.png'),
  'capsule-purple-white-3': require('../assets/icons/supplements/capsule-purple-white-3.png'),
  'capsule-orange-white': require('../assets/icons/supplements/capsule-orange-white.png'),
  'capsule-red-white': require('../assets/icons/supplements/capsule-red-white.png'),
  'capsule-red-pink': require('../assets/icons/supplements/capsule-red-pink.png'),
  'capsule-pink-white': require('../assets/icons/supplements/capsule-pink-white.png'),
  'capsule-brown-white': require('../assets/icons/supplements/capsule-brown-white.png'),
  'capsule-pink-metallic': require('../assets/icons/supplements/capsule-pink-metallic.png'),
  'capsule-gray-white': require('../assets/icons/supplements/capsule-gray-white.png'),
  'capsule-holographic': require('../assets/icons/supplements/capsule-holographic.png'),
  'capsule-iridescent': require('../assets/icons/supplements/capsule-iridescent.png'),
  'capsule-orange-pink': require('../assets/icons/supplements/capsule-orange-pink.png'),
  'capsule-orange-wave': require('../assets/icons/supplements/capsule-orange-wave.png'),
  'capsule-pink-blue': require('../assets/icons/supplements/capsule-pink-blue.png'),
  'capsule-mushroom': require('../assets/icons/supplements/capsule-mushroom.png'),
  'capsule-red-purple': require('../assets/icons/supplements/capsule-red-purple.png'),

  // === ADDITIONAL HERBS / MUSHROOMS ===
  'gotu-kola': require('../assets/icons/supplements/gotu-kola.png'),
  'green-tea': require('../assets/icons/supplements/green-tea.png'),
  moringa: require('../assets/icons/supplements/moringa.png'),
  echinacea: require('../assets/icons/supplements/echinacea.png'),
  reishi: require('../assets/icons/supplements/reishi.png'),
  tribulus: require('../assets/icons/supplements/tribulus.png'),
  'ginger-root': require('../assets/icons/supplements/ginger-root.png'),
  'noni-fruit': require('../assets/icons/supplements/noni-fruit.png'),
  'chaga-bowl': require('../assets/icons/supplements/chaga-bowl.png'),
  'probiotic-bottle': require('../assets/icons/supplements/probiotic-bottle.png'),
  'herbal-mortar': require('../assets/icons/supplements/herbal-mortar.png'),
  'beta-glucan-oat': require('../assets/icons/supplements/beta-glucan-oat.png'),
  'celery-silica': require('../assets/icons/supplements/celery-silica.png'),
  'green-tea-capsule': require('../assets/icons/supplements/green-tea-capsule.png'),
  'mineral-tablet': require('../assets/icons/supplements/mineral-tablet.png'),
  'capsule-teal': require('../assets/icons/supplements/capsule-teal.png'),
  'strawberry-vitc': require('../assets/icons/supplements/strawberry-vitc.png'),

  // === UI ICONS ===
  'ui-notebook': require('../assets/icons/supplements/ui-notebook.png'),
  'ui-camera': require('../assets/icons/supplements/ui-camera.png'),
  'ui-barcode': require('../assets/icons/supplements/ui-barcode.png'),
  'ui-search': require('../assets/icons/supplements/ui-search.png'),
  'ui-sun': require('../assets/icons/supplements/ui-sun.png'),
  'ui-moon': require('../assets/icons/supplements/ui-moon.png'),
  'ui-sunrise': require('../assets/icons/supplements/ui-sunrise.png'),
  'ui-sunset': require('../assets/icons/supplements/ui-sunset.png'),
  'ui-dna': require('../assets/icons/supplements/ui-dna.png'),
} as const;

type IconKey = keyof typeof icons;

/** Supplement name → icon key mapping */
const SUPPLEMENT_ICON_MAP: Record<string, IconKey> = {
  // PROTEIN
  'Whey Protein': 'whey-protein',
  'Whey Protein Isolate': 'whey-protein-white',
  'Casein Protein': 'whey-protein-white',
  'Pea Protein': 'pea-protein',
  'Soy Protein': 'soy-protein',
  'Pea & Rice Protein': 'pea-rice-protein',
  'Hemp Protein': 'pea-protein',
  'Beef Protein Isolate': 'capsule-brown-white',
  'Collagen Peptides': 'collagen-dissolve',
  'Marine Collagen': 'collagen-gold',
  'Hydrolyzed Collagen': 'collagen-cream',
  'Collagen Type II': 'collagen-capsule',

  // CREATINE
  'Creatine Monohydrate': 'creatine-monohydrate',
  'Creatine HCL': 'creatine-white',
  'Kre-Alkalyn': 'creatine-white',
  'Buffered Creatine': 'creatine-white',

  // AMINO ACIDS
  BCAA: 'bcaa',
  'L-Glutamine': 'white-powder',
  'L-Arginine': 'beetroot',
  'L-Citrulline': 'citrulline',
  'Citrulline Malate': 'citrulline',
  'Beta-Alanine': 'amino-acid',
  'L-Carnitine': 'capsule-red-white',
  'Acetyl L-Carnitine': 'capsule-red-white',
  'L-Theanine': 'chamomile-flower',
  Taurine: 'taurine',
  Carnosine: 'amino-acid',
  HMB: 'capsule-orange-white',
  EAA: 'amino-acid',

  // VITAMINS
  'Vitamin C': 'vitamin-c',
  'Vitamin D3': 'vitamin-tablet',
  'Vitamin D3 + K2': 'vitamin-tablet',
  'Vitamin K2': 'capsule-purple-white',
  'Vitamin E': 'evening-primrose',
  'Vitamin A': 'capsule-orange-white',
  'Vitamin B12': 'vitamin-b',
  Methylcobalamin: 'vitamin-b',
  'Vitamin B6': 'vitamin-b',
  'Vitamin B Complex': 'multivitamin',
  Folate: 'vitamin-b',
  'Methylfolate (5-MTHF)': 'vitamin-b',
  Biotin: 'capsule-pink-white',
  'Niacin (Vitamin B3)': 'vitamin-b',
  Multivitamin: 'multivitamin',
  'Prenatal Vitamins': 'multivitamin',

  // MINERALS
  'Magnesium Glycinate': 'magnesium',
  'Magnesium Citrate': 'magnesium',
  'Magnesium Malate': 'magnesium',
  'Magnesium L-Threonate': 'magnesium',
  'Magnesium Bisglycinate': 'magnesium',
  Zinc: 'mineral-crystal',
  'Zinc Picolinate': 'mineral-crystal',
  'Zinc Carnosine': 'mineral-crystal',
  Iron: 'iron',
  'Iron Bisglycinate': 'iron',
  Calcium: 'calcium-bone',
  'Calcium Citrate': 'calcium-bone',
  Potassium: 'potassium',
  Selenium: 'capsule-gray-white',
  'Chromium Picolinate': 'capsule-gray-white',
  Iodine: 'capsule-blue-white',
  Copper: 'mineral-crystal',
  Manganese: 'mineral-crystal',
  Boron: 'capsule-gray-white',
  Silica: 'capsule-gray-white',
  ZMA: 'magnesium',
  'Sodium Bicarbonate': 'white-powder',
  Electrolytes: 'mineral-crystal',

  // OMEGA / OILS
  'Fish Oil': 'fish-oil',
  'Omega-3': 'fish-oil',
  'Krill Oil': 'astaxanthin',
  'Algae Oil': 'fish-oil',
  'MCT Oil': 'mct-oil',
  'Flaxseed Oil': 'amber-oil-bottle',
  'Evening Primrose Oil': 'evening-primrose-flower',
  'Borage Oil': 'amber-oil-bottle',
  'Black Seed Oil (Nigella Sativa)': 'black-seed-oil',
  'Olive Leaf Extract': 'olive-oil',

  // PROBIOTICS / GUT
  Probiotic: 'probiotic',
  Lactobacillus: 'probiotic',
  Bifidobacterium: 'probiotic-yogurt',
  'Prebiotic Fiber': 'wheatgrass',
  'Psyllium Husk': 'white-powder',
  'Zinc Carnosine (gut)': 'probiotic-yogurt',

  // HEART / CARDIOVASCULAR
  CoQ10: 'coq10-heart',
  Ubiquinol: 'ubiquinol',
  Nattokinase: 'capsule-red-silver',
  'Red Yeast Rice': 'capsule-red-white',
  Berberine: 'cinnamon',
  'Garlic Extract': 'capsule-white-powder',
  'Hawthorn Berry': 'elderberry',

  // ANTIOXIDANTS
  'Vitamin C (Antioxidant)': 'vitamin-c-orange',
  Resveratrol: 'bilberry',
  Quercetin: 'blueberry',
  Pterostilbene: 'bilberry',
  Astaxanthin: 'astaxanthin',
  Lycopene: 'lycopene-tomato',
  Lutein: 'lutein-marigold',
  Zeaxanthin: 'lutein-marigold',
  'Alpha Lipoic Acid': 'capsule-holographic',
  'Grape Seed Extract': 'grape-seed',
  'Pomegranate Extract': 'pomegranate',
  'Tart Cherry Extract': 'tart-cherry',
  'Acai Berry': 'acai-berry',
  Elderberry: 'elderberry',
  'Bilberry Extract': 'bilberry',
  'Blueberry Extract': 'blueberry',
  Pycnogenol: 'pycnogenol',

  // MUSHROOMS
  "Lion's Mane": 'nootropic-brain',
  Reishi: 'reishi',
  Cordyceps: 'cordyceps',
  Chaga: 'chaga-bowl',
  'Turkey Tail': 'capsule-mushroom',

  // BRAIN / NOOTROPICS
  'Alpha-GPC': 'nootropic-brain',
  'CDP-Choline': 'nootropic-circuit',
  Phosphatidylserine: 'nootropic-brain',
  'Bacopa Monnieri': 'nootropic-brain',
  'Ginkgo Biloba': 'capsule-iridescent',
  'Huperzine A': 'nootropic-circuit',
  Vinpocetine: 'nootropic-circuit',
  'Gotu Kola': 'gotu-kola',
  'Rhodiola Rosea': 'capsule-pink-metallic',

  // HERBS & ADAPTOGENS
  Ashwagandha: 'ashwagandha',
  'KSM-66 Ashwagandha': 'ashwagandha-root',
  'Sensoril Ashwagandha': 'ashwagandha-root',
  'Maca Root': 'maca-root',
  'Maca Powder': 'maca-powder',
  Saffron: 'saffron',
  Turmeric: 'cinnamon',
  Curcumin: 'cinnamon',
  'Ginger Extract': 'ginger-root',
  Moringa: 'moringa',
  Echinacea: 'echinacea',
  'Tribulus Terrestris': 'tribulus',
  'Beta-Glucan': 'beta-glucan-oat',
  'Ceylon Cinnamon': 'cinnamon',
  Boswellia: 'boswellia',
  'Valerian Root': 'chamomile-flower',
  'Passion Flower': 'chamomile-flower',
  Chamomile: 'chamomile-flower',
  'Aloe Vera': 'aloe-vera',
  'Schisandra Berry': 'schisandra',
  'Holy Basil (Tulsi)': 'holy-basil',
  Astragalus: 'holy-basil-leaf',
  'Mucuna Pruriens': 'mucuna-pruriens',
  'Green Tea Extract': 'green-tea',
  EGCG: 'green-tea-capsule',
  'Green Coffee Extract': 'green-coffee',
  'Cayenne Pepper': 'cayenne-pepper',
  'Garcinia Cambogia': 'garcinia-cambogia',

  // SLEEP
  Melatonin: 'capsule-lavender',
  '5-HTP': 'capsule-purple-white',
  GABA: 'capsule-blue-soft',
  'Magnesium (Sleep)': 'magnesium',
  'L-Glycine': 'white-powder',

  // WEIGHT MANAGEMENT
  CLA: 'capsule-orange-wave',
  Glucomannan: 'white-powder',
  'White Kidney Bean Extract': 'white-kidney-bean',
  'Chromium (Weight)': 'capsule-gray-white',

  // JOINT & BONE
  'Glucosamine Sulfate': 'glucosamine',
  Chondroitin: 'calcium-bone',
  MSM: 'capsule-gray-white',
  'Hyaluronic Acid': 'collagen-gold',
  Bromelain: 'bromelain-pineapple',
  'Boswellia (Joint)': 'boswellia',

  // LIVER
  'Milk Thistle': 'capsule-iridescent',
  Silymarin: 'capsule-iridescent',
  NAC: 'capsule-holographic',
  TUDCA: 'amber-oil-bottle',
  'Artichoke Extract': 'artichoke',

  // SPECIAL
  NMN: 'collagen-gold',
  'NR (Nicotinamide Riboside)': 'capsule-iridescent',
  Spermidine: 'capsule-holographic',
  Spirulina: 'spirulina',
  Chlorella: 'spirulina',
  'Beta-Glucan (Oat)': 'beta-glucan-oat',
  Sulforaphane: 'sulforaphane-broccoli',
  DIM: 'sulforaphane-broccoli',
  Inositol: 'taurine',
  Tocotrienols: 'evening-primrose',
  'Ubiquinol (CoQ10)': 'ubiquinol',
  Colostrum: 'whey-protein-white',
  'Tocotrienols (Vitamin E)': 'evening-primrose',
  'Methylcobalamin (B12)': 'vitamin-b',
  Caffeine: 'caffeine',
  'Pre-Workout': 'pre-workout',

  // PROTEIN POWDERS (all variants)
  'Protein Powder': 'whey-protein',
  'Plant Protein': 'pea-protein',
};

/**
 * Returns the correct icon source for a supplement by name.
 * Falls back to a color-coded capsule based on category if no specific match.
 */
export function getSupplementIcon(name: string, category?: string): ReturnType<typeof require> {
  // Exact match
  if (name in SUPPLEMENT_ICON_MAP) {
    const key = SUPPLEMENT_ICON_MAP[name];
    return icons[key];
  }

  // Partial match (case-insensitive keyword)
  const nameLower = name.toLowerCase();
  for (const [mapName, iconKey] of Object.entries(SUPPLEMENT_ICON_MAP)) {
    if (nameLower.includes(mapName.toLowerCase()) || mapName.toLowerCase().includes(nameLower)) {
      return icons[iconKey];
    }
  }

  // Category fallback
  return getCategoryFallbackIcon(category);
}

function getCategoryFallbackIcon(category?: string): ReturnType<typeof require> {
  if (!category) return icons['capsule-blue-white'];
  const c = category.toLowerCase();
  if (c.includes('protein')) return icons['whey-protein'];
  if (c.includes('vitamin')) return icons['multivitamin'];
  if (c.includes('mineral')) return icons['mineral-crystal'];
  if (c.includes('omega') || c.includes('yag')) return icons['fish-oil'];
  if (c.includes('probioti')) return icons['probiotic'];
  if (c.includes('bitki') || c.includes('herb')) return icons['ashwagandha'];
  if (c.includes('antioks')) return icons['blueberry'];
  if (c.includes('uyku') || c.includes('sleep')) return icons['capsule-lavender'];
  if (c.includes('eklem') || c.includes('joint')) return icons['glucosamine'];
  if (c.includes('performans')) return icons['pre-workout'];
  if (c.includes('beyin') || c.includes('brain')) return icons['nootropic-brain'];
  return icons['capsule-blue-white'];
}

/** Direct icon access by key (for UI icons like camera, barcode) */
export function getUIIcon(
  key: 'camera' | 'barcode' | 'search' | 'notebook' | 'sun' | 'moon',
): ReturnType<typeof require> {
  const map = {
    camera: icons['ui-camera'],
    barcode: icons['ui-barcode'],
    search: icons['ui-search'],
    notebook: icons['ui-notebook'],
    sun: icons['ui-sun'],
    moon: icons['ui-moon'],
  };
  return map[key];
}
