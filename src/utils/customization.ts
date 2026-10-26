import { SkinItem, SkiItem, CustomizationState } from '../types/game';

export const AVAILABLE_SKINS: SkinItem[] = [
  {
    id: 'skin_classic',
    name: 'Bleu Alpin Classique',
    description: 'La combinaison de compétition officielle des équipes de France et de Suisse.',
    priceEur: 0,
    priceCoins: 0,
    colorHex: '#2563eb',
    jacketColor: 0x2563eb,
    accentColor: 0xf59e0b,
    gogglesColor: 0xf59e0b,
    rarity: 'common',
  },
  {
    id: 'skin_cyber_neon',
    name: 'Cyber Fluo Matrix',
    description: 'Combinaison aéro-dynamique réfléchissante haute visibilité dans le blizzard.',
    priceEur: 0.99,
    priceCoins: 500,
    colorHex: '#06b6d4',
    jacketColor: 0x06b6d4,
    accentColor: 0x10b981,
    gogglesColor: 0x22c55e,
    rarity: 'rare',
  },
  {
    id: 'skin_arctic_camo',
    name: 'Camouflage Arctique',
    description: 'Furtivité absolue dans la poudreuse. Tissu thermique polaire grand froid.',
    priceEur: 1.49,
    priceCoins: 750,
    colorHex: '#e2e8f0',
    jacketColor: 0xe2e8f0,
    accentColor: 0x64748b,
    gogglesColor: 0x38bdf8,
    rarity: 'rare',
  },
  {
    id: 'skin_royal_gold',
    name: 'Doudoune Dorée Royale',
    description: 'Finition or métallisé brossé et duvet d’oie haut de gamme pour les skieurs d’élite.',
    priceEur: 1.99,
    priceCoins: 1000,
    colorHex: '#eab308',
    jacketColor: 0xeab308,
    accentColor: 0x0f172a,
    gogglesColor: 0xffffff,
    rarity: 'epic',
  },
  {
    id: 'skin_magma_flame',
    name: 'Lave Incandescente',
    description: 'Énergie volcanique pure. Fait fondre la neige et les obstacles sur son passage !',
    priceEur: 2.49,
    priceCoins: 1500,
    colorHex: '#ef4444',
    jacketColor: 0xdc2626,
    accentColor: 0xf97316,
    gogglesColor: 0xfacc15,
    rarity: 'legendary',
  },
];

export const AVAILABLE_SKIS: SkiItem[] = [
  {
    id: 'ski_carve_red',
    name: 'Carve Pro 90',
    description: 'Skis de descente polyvalents avec double rayon et carres en acier trempé.',
    priceEur: 0,
    priceCoins: 0,
    colorHex: '#ef4444',
    skiColor: 0xef4444,
    roughness: 0.2,
    metalness: 0.6,
    rarity: 'common',
  },
  {
    id: 'ski_carbon_titanium',
    name: 'Titanium Carbone X',
    description: 'Planches ultra-légères en fibre de carbone tressée pour virages incisifs.',
    priceEur: 0.99,
    priceCoins: 500,
    colorHex: '#1e293b',
    skiColor: 0x1e293b,
    roughness: 0.1,
    metalness: 0.95,
    rarity: 'rare',
  },
  {
    id: 'ski_aurora_emerald',
    name: 'Aurore Boréale',
    description: 'Finition nacrée verte boréale avec reflets holographiques dans la neige.',
    priceEur: 1.49,
    priceCoins: 750,
    colorHex: '#10b981',
    skiColor: 0x10b981,
    roughness: 0.15,
    metalness: 0.85,
    rarity: 'rare',
  },
  {
    id: 'ski_olympic_gold',
    name: 'Or Olympique 24K',
    description: 'Plaquage or massif 24 carats poli miroir. La marque des champions de Coupe du Monde.',
    priceEur: 1.99,
    priceCoins: 1000,
    colorHex: '#fbbf24',
    skiColor: 0xfbbf24,
    roughness: 0.05,
    metalness: 0.98,
    rarity: 'epic',
  },
  {
    id: 'ski_plasma_flame',
    name: 'Flammes Solaires',
    description: 'Carres thermiques embrasées laissant une traînée de feu dans la poudreuse.',
    priceEur: 2.49,
    priceCoins: 1500,
    colorHex: '#f97316',
    skiColor: 0xf97316,
    roughness: 0.1,
    metalness: 0.9,
    rarity: 'legendary',
  },
];

const CUSTOMIZATION_STORAGE_KEY = 'sommet_blanc_customization_v1';

export function getSavedCustomization(): CustomizationState {
  try {
    const raw = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        equippedSkinId: parsed.equippedSkinId || 'skin_classic',
        equippedSkiId: parsed.equippedSkiId || 'ski_carve_red',
        unlockedSkinIds: Array.isArray(parsed.unlockedSkinIds) ? parsed.unlockedSkinIds : ['skin_classic'],
        unlockedSkiIds: Array.isArray(parsed.unlockedSkiIds) ? parsed.unlockedSkiIds : ['ski_carve_red'],
      };
    }
  } catch {
    // Ignore storage errors
  }

  return {
    equippedSkinId: 'skin_classic',
    equippedSkiId: 'ski_carve_red',
    unlockedSkinIds: ['skin_classic'],
    unlockedSkiIds: ['ski_carve_red'],
  };
}

export function saveCustomization(state: CustomizationState) {
  try {
    localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

export function getEquippedSkin(customization: CustomizationState): SkinItem {
  return AVAILABLE_SKINS.find((s) => s.id === customization.equippedSkinId) || AVAILABLE_SKINS[0];
}

export function getEquippedSki(customization: CustomizationState): SkiItem {
  return AVAILABLE_SKIS.find((s) => s.id === customization.equippedSkiId) || AVAILABLE_SKIS[0];
}
