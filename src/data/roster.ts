import type { PlayerDef } from '../types';

// ============================================================================
// Kadro. Bizim id'ler "u" önekli, rakip "r" önekli.
// Biz: K(kaleci), 4-5-3 (stoper; 5=libero), 6(pivot), 8(box-to-box),
//      11-7(kanat), 9(hedef forvet).
// Rakip: K, 2, 5, 6, 7, 10, 11, 9.
// ============================================================================

export const US: PlayerDef[] = [
  { id: 'uK', team: 'us', label: 'K', gk: true },
  { id: 'u4', team: 'us', label: '4' },
  { id: 'u5', team: 'us', label: '5' },
  { id: 'u3', team: 'us', label: '3' },
  { id: 'u6', team: 'us', label: '6' },
  { id: 'u8', team: 'us', label: '8' },
  { id: 'u11', team: 'us', label: '11' },
  { id: 'u7', team: 'us', label: '7' },
  { id: 'u9', team: 'us', label: '9' },
];

export const THEM: PlayerDef[] = [
  { id: 'rK', team: 'them', label: 'K', gk: true },
  { id: 'r2', team: 'them', label: '2' },
  { id: 'r5', team: 'them', label: '5' },
  { id: 'r6', team: 'them', label: '6' },
  { id: 'r7', team: 'them', label: '7' },
  { id: 'r10', team: 'them', label: '10' },
  { id: 'r11', team: 'them', label: '11' },
  { id: 'r9', team: 'them', label: '9' },
];

export const ALL_PLAYERS: PlayerDef[] = [...US, ...THEM];

export const PLAYER_BY_ID: Record<string, PlayerDef> = Object.fromEntries(
  ALL_PLAYERS.map((p) => [p.id, p]),
);
