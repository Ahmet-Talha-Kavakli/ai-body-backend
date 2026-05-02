const icons: Record<string, ReturnType<typeof require>> = {
  // Koşu
  running_road: require('../assets/activity-icons/running_road.png'),
  running_trail: require('../assets/activity-icons/running_trail.png'),
  running_treadmill: require('../assets/activity-icons/running_treadmill.png'),
  running_interval: require('../assets/activity-icons/running_interval.png'),
  running_marathon: require('../assets/activity-icons/running_marathon.png'),
  // Yürüyüş
  walking_urban: require('../assets/activity-icons/walking_urban.png'),
  walking_nature: require('../assets/activity-icons/walking_nature.png'),
  walking_nordic: require('../assets/activity-icons/walking_nordic.png'),
  walking_brisk: require('../assets/activity-icons/walking_brisk.png'),
  // Bisiklet
  cycling_road: require('../assets/activity-icons/cycling_road.png'),
  cycling_mountain: require('../assets/activity-icons/cycling_mountain.png'),
  cycling_stationary: require('../assets/activity-icons/cycling_stationary.png'),
  cycling_city: require('../assets/activity-icons/cycling_city.png'),
  // Futbol
  football_halisaha: require('../assets/activity-icons/football_halisaha.png'),
  football_match: require('../assets/activity-icons/football_match.png'),
  football_training: require('../assets/activity-icons/football_training.png'),
  football_beach: require('../assets/activity-icons/football_beach.png'),
  // Yüzme
  swimming_pool: require('../assets/activity-icons/swimming_pool.png'),
  swimming_sea: require('../assets/activity-icons/swimming_sea.png'),
  swimming_laps: require('../assets/activity-icons/swimming_laps.png'),
  swimming_therapy: require('../assets/activity-icons/swimming_therapy.png'),
  // Tenis
  tennis_match: require('../assets/activity-icons/tennis_match.png'),
  tennis_training: require('../assets/activity-icons/tennis_training.png'),
  tennis_doubles: require('../assets/activity-icons/tennis_doubles.png'),
  // Basketbol
  basketball_match: require('../assets/activity-icons/basketball_match.png'),
  basketball_training: require('../assets/activity-icons/basketball_training.png'),
  basketball_street: require('../assets/activity-icons/basketball_street.png'),
  // Voleybol
  volleyball_match: require('../assets/activity-icons/volleyball_match.png'),
  volleyball_training: require('../assets/activity-icons/volleyball_training.png'),
  volleyball_beach: require('../assets/activity-icons/volleyball_beach.png'),
  // Boks
  boxing_bag: require('../assets/activity-icons/boxing_bag.png'),
  boxing_sparring: require('../assets/activity-icons/boxing_sparring.png'),
  boxing_shadow: require('../assets/activity-icons/boxing_shadow.png'),
  boxing_kickbox: require('../assets/activity-icons/boxing_kickbox.png'),
  // Yoga
  yoga_hatha: require('../assets/activity-icons/yoga_hatha.png'),
  yoga_vinyasa: require('../assets/activity-icons/yoga_vinyasa.png'),
  yoga_yin: require('../assets/activity-icons/yoga_yin.png'),
  yoga_hot: require('../assets/activity-icons/yoga_hot.png'),
  yoga_power: require('../assets/activity-icons/yoga_power.png'),
  // Pilates
  pilates_mat: require('../assets/activity-icons/pilates_mat.png'),
  pilates_reformer: require('../assets/activity-icons/pilates_reformer.png'),
  pilates_clinical: require('../assets/activity-icons/pilates_clinical.png'),
  // Dans
  dance_free: require('../assets/activity-icons/dance_free.png'),
  dance_salsa: require('../assets/activity-icons/dance_salsa.png'),
  dance_hiphop: require('../assets/activity-icons/dance_hiphop.png'),
  dance_zumba: require('../assets/activity-icons/dance_zumba.png'),
  dance_ballet: require('../assets/activity-icons/dance_ballet.png'),
  // Sauna
  sauna_dry: require('../assets/activity-icons/sauna_dry.png'),
  sauna_hamam: require('../assets/activity-icons/sauna_hamam.png'),
  sauna_infrared: require('../assets/activity-icons/sauna_infrared.png'),
  sauna_steam: require('../assets/activity-icons/sauna_steam.png'),
  // Şok Havuzu
  cold_icebath: require('../assets/activity-icons/cold_icebath.png'),
  cold_shower: require('../assets/activity-icons/cold_shower.png'),
  cold_contrast: require('../assets/activity-icons/cold_contrast.png'),
  // Golf
  golf_18holes: require('../assets/activity-icons/golf_18holes.png'),
  golf_9holes: require('../assets/activity-icons/golf_9holes.png'),
  golf_range: require('../assets/activity-icons/golf_range.png'),
  // Padel
  padel_match: require('../assets/activity-icons/padel_match.png'),
  padel_training: require('../assets/activity-icons/padel_training.png'),
  // Su Topu
  waterpolo_match: require('../assets/activity-icons/waterpolo_match.png'),
  waterpolo_training: require('../assets/activity-icons/waterpolo_training.png'),
  // Masaj
  massage_sports: require('../assets/activity-icons/massage_sports.png'),
  massage_relax: require('../assets/activity-icons/massage_relax.png'),
  massage_deeptissue: require('../assets/activity-icons/massage_deeptissue.png'),
  // Esneme
  stretching_static: require('../assets/activity-icons/stretching_static.png'),
  stretching_dynamic: require('../assets/activity-icons/stretching_dynamic.png'),
  stretching_foam: require('../assets/activity-icons/stretching_foam.png'),
  // Doğa Yürüyüşü
  hiking_easy: require('../assets/activity-icons/hiking_easy.png'),
  hiking_moderate: require('../assets/activity-icons/hiking_moderate.png'),
  hiking_hard: require('../assets/activity-icons/hiking_hard.png'),
  // Meditasyon
  meditation_breathing: require('../assets/activity-icons/meditation_breathing.png'),
  meditation_guided: require('../assets/activity-icons/meditation_guided.png'),
  meditation_mindfulness: require('../assets/activity-icons/meditation_mindfulness.png'),
  // Kürek
  rowing_boat: require('../assets/activity-icons/rowing_boat.png'),
  rowing_machine: require('../assets/activity-icons/rowing_machine.png'),
  rowing_canoe: require('../assets/activity-icons/rowing_canoe.png'),
  // İp Atlama
  jump_rope: require('../assets/activity-icons/jump_rope.png'),
  // Kardiyo Ekipmanları
  elliptical: require('../assets/activity-icons/elliptical.png'),
  stepper: require('../assets/activity-icons/stepper.png'),
  orbitrek: require('../assets/activity-icons/orbitrek.png'),
};

export const ALL_ACTIVITY_ICONS = icons;

export function getActivitySubIcon(subTypeKey: string): ReturnType<typeof require> | null {
  return icons[subTypeKey] ?? null;
}

// Ana aktivite → temsilci ikon
const MAIN_ACTIVITY_ICON: Record<string, string> = {
  running: 'running_road',
  walking: 'walking_urban',
  cycling: 'cycling_road',
  football: 'football_match',
  swimming: 'swimming_pool',
  tennis: 'tennis_match',
  basketball: 'basketball_match',
  volleyball: 'volleyball_match',
  boxing: 'boxing_bag',
  yoga: 'yoga_hatha',
  pilates: 'pilates_mat',
  dance: 'dance_free',
  sauna: 'sauna_dry',
  cold_pool: 'cold_icebath',
  golf: 'golf_18holes',
  padel: 'padel_match',
  water_polo: 'waterpolo_match',
  massage: 'massage_relax',
  stretching: 'stretching_static',
  hiking: 'hiking_moderate',
  meditation: 'meditation_mindfulness',
  rowing: 'rowing_machine',
  jump_rope: 'jump_rope',
  elliptical: 'elliptical',
  stepper: 'stepper',
  orbitrek: 'orbitrek',
};

export function getMainActivityIcon(activityType: string): ReturnType<typeof require> | null {
  const key = MAIN_ACTIVITY_ICON[activityType];
  return key ? (icons[key] ?? null) : null;
}

// Hangi activityType'ların alt türü var
export const ACTIVITY_TYPES_WITH_SUBTYPES = new Set([
  'running',
  'walking',
  'cycling',
  'football',
  'swimming',
  'tennis',
  'basketball',
  'volleyball',
  'boxing',
  'yoga',
  'pilates',
  'dance',
  'sauna',
  'cold_pool',
  'golf',
  'padel',
  'water_polo',
  'massage',
  'stretching',
  'hiking',
  'meditation',
  'rowing',
]);
