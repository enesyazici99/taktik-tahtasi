// ============================================================================
// Hız sabitleri (normalize birim / saniye — saha yüksekliği = 1), renkler,
// ölçüler. Derleyici süreleri buradan hesaplar.
// ============================================================================

export const SPEEDS = {
  walk: 0.055,
  jog: 0.11,
  sprint: 0.2,
  pass: 0.38,
  longPass: 0.3,
  shot: 0.55,
  dribble: 0.09,
} as const;

export type SpeedId = keyof typeof SPEEDS;

// Doğrulama eşikleri
export const MAX_PLAYER_SPEED = SPEEDS.sprint * 1.05; // ışınlanma toleransı
export const MAX_BALL_IDLE_MS = 300; // top sahipsiz boşta kalma sınırı

// Referans tasarım alanı (SVG viewBox). Saha oranı ~17:25 dikey.
export const DESIGN = {
  width: 680,
  height: 1000,
  margin: 40, // saha kenar boşluğu
} as const;

// Renk paleti — "gece antrenmanı panosu"
export const COLORS = {
  bg: '#101614',
  pitch: '#1E5A34',
  pitchLine: '#2E7B45',
  chalk: '#F4F1E6',
  chalkDim: 'rgba(244, 241, 230, 0.7)',
  us: '#F4F1E6',
  usGk: '#FFD166',
  usNumber: '#101614',
  them: '#E24B4A',
  themGk: '#A32D2D',
  themNumber: '#F4F1E6',
  accent: '#FFD166', // tek vurgu rengi
} as const;

// Zamanlama sabitleri (ms)
export const TIMING = {
  resetRun: 1200, // loop reset koşusu
  oneTouch: 120, // one-touch pas bekleme
  arriveBefore: 150, // koşu topun varışından önce biter
  runArrowLead: 400, // koşu oku koşudan önce belirir
  blend: 300, // track↔behavior yumuşak geçiş
  noteFade: 150,
} as const;

// idleSway parametreleri
export const IDLE = {
  amp: 0.004,
  freq: 0.0016, // rad/ms
} as const;
