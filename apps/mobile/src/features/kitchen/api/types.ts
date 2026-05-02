export type PantryCategory =
  | 'protein'
  | 'sebze'
  | 'meyve'
  | 'süt'
  | 'tahıl'
  | 'baharat'
  | 'içecek'
  | 'diğer';

export type PantryItem = {
  id: string;
  name: string;
  category: PantryCategory | string | null;
  quantity: number | null;
  unit: string | null;
  expiresAt: string | null;
  photoUrl: string | null;
  source: 'manual' | 'photo_scan' | 'barcode' | string;
  isLowStock: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScannedItem = {
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  expiresAt: string | null;
};
