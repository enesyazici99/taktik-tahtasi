import type { Formation, Vec } from '../types';

// ============================================================================
// Dizilimler. Bizim kale altta (y=1), rakip kale üstte (y=0).
// Her Formation hem bizim hem rakip başlangıç pozlarını içerir → tahta dolu.
// ============================================================================

// --- 3-2-3: standart hücum şeklimiz, rakip orta blokta savunur ---
const US_323: Record<string, Vec> = {
  uK: { x: 0.5, y: 0.95 },
  u4: { x: 0.28, y: 0.76 },
  u5: { x: 0.5, y: 0.8 },
  u3: { x: 0.72, y: 0.76 },
  u6: { x: 0.5, y: 0.6 },
  u8: { x: 0.6, y: 0.52 },
  u11: { x: 0.2, y: 0.38 },
  u9: { x: 0.5, y: 0.3 },
  u7: { x: 0.8, y: 0.38 },
};

const THEM_MIDBLOCK: Record<string, Vec> = {
  rK: { x: 0.5, y: 0.05 },
  r6: { x: 0.28, y: 0.22 },
  r5: { x: 0.5, y: 0.2 },
  r2: { x: 0.72, y: 0.22 },
  r10: { x: 0.5, y: 0.38 },
  r7: { x: 0.3, y: 0.34 },
  r11: { x: 0.7, y: 0.34 },
  r9: { x: 0.5, y: 0.55 }, // ofsayt yok: forvet derinde kamp kurar
};

export const F323: Formation = {
  id: 'F323',
  name: '3-2-3 Hücum',
  positions: { ...US_323, ...THEM_MIDBLOCK },
};

// --- 3-4-1: savunma şeklimiz (kanatlar iner), rakip hücum eder ---
const US_341: Record<string, Vec> = {
  uK: { x: 0.5, y: 0.95 },
  u4: { x: 0.3, y: 0.8 },
  u5: { x: 0.5, y: 0.82 },
  u3: { x: 0.7, y: 0.8 },
  u11: { x: 0.16, y: 0.66 },
  u6: { x: 0.4, y: 0.68 },
  u8: { x: 0.6, y: 0.68 },
  u7: { x: 0.84, y: 0.66 },
  u9: { x: 0.5, y: 0.48 },
};

const THEM_ATTACK: Record<string, Vec> = {
  rK: { x: 0.5, y: 0.05 },
  r6: { x: 0.3, y: 0.25 },
  r5: { x: 0.5, y: 0.22 },
  r2: { x: 0.7, y: 0.25 },
  r10: { x: 0.5, y: 0.42 },
  r7: { x: 0.25, y: 0.5 },
  r11: { x: 0.75, y: 0.5 },
  r9: { x: 0.5, y: 0.7 }, // derinde kamp
};

export const F341: Formation = {
  id: 'F341',
  name: '3-4-1 Savunma',
  positions: { ...US_341, ...THEM_ATTACK },
};

// --- Yüksek blok pres: rakip kaleciden kurar, biz yukarıda presleriz ---
const US_PRESS: Record<string, Vec> = {
  uK: { x: 0.5, y: 0.9 },
  u4: { x: 0.3, y: 0.68 },
  u5: { x: 0.5, y: 0.72 },
  u3: { x: 0.7, y: 0.68 },
  u6: { x: 0.5, y: 0.52 },
  u8: { x: 0.58, y: 0.44 },
  u11: { x: 0.22, y: 0.34 },
  u7: { x: 0.78, y: 0.34 },
  u9: { x: 0.5, y: 0.24 },
};

const THEM_BUILDUP: Record<string, Vec> = {
  rK: { x: 0.5, y: 0.06 },
  r6: { x: 0.3, y: 0.16 },
  r5: { x: 0.5, y: 0.14 },
  r2: { x: 0.7, y: 0.16 },
  r10: { x: 0.5, y: 0.3 },
  r7: { x: 0.28, y: 0.28 },
  r11: { x: 0.72, y: 0.28 },
  r9: { x: 0.5, y: 0.62 },
};

export const FPRESS: Formation = {
  id: 'FPRESS',
  name: 'Yüksek Blok Pres',
  positions: { ...US_PRESS, ...THEM_BUILDUP },
};

export const FORMATIONS: Record<string, Formation> = {
  F323,
  F341,
  FPRESS,
};

// --- v2 dizilim varyantları (bizim şeklimiz) — editör/analiz modu için ---
export const US_VARIANTS: Record<string, { name: string; positions: Record<string, Vec> }> = {
  '3-2-3': { name: '3-2-3', positions: US_323 },
  '3-4-1': { name: '3-4-1', positions: US_341 },
  '2-4-2': {
    name: '2-4-2',
    positions: {
      uK: { x: 0.5, y: 0.95 },
      u4: { x: 0.36, y: 0.78 },
      u5: { x: 0.64, y: 0.78 },
      u6: { x: 0.5, y: 0.62 },
      u3: { x: 0.2, y: 0.56 },
      u8: { x: 0.8, y: 0.56 },
      u11: { x: 0.34, y: 0.34 },
      u7: { x: 0.66, y: 0.34 },
      u9: { x: 0.5, y: 0.26 },
    },
  },
  '3-3-2': {
    name: '3-3-2',
    positions: {
      uK: { x: 0.5, y: 0.95 },
      u4: { x: 0.28, y: 0.78 },
      u5: { x: 0.5, y: 0.8 },
      u3: { x: 0.72, y: 0.78 },
      u11: { x: 0.24, y: 0.56 },
      u6: { x: 0.5, y: 0.58 },
      u7: { x: 0.76, y: 0.56 },
      u8: { x: 0.38, y: 0.34 },
      u9: { x: 0.62, y: 0.34 },
    },
  },
};
