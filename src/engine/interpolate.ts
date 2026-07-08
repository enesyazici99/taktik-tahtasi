import type { EasingId, EntityTrack, Vec } from '../types';

// ============================================================================
// Interpolasyon + easing. Tümü saf fonksiyon — t verildiğinde aynı sonuç.
// ============================================================================

export type Easing = (u: number) => number;

export const EASINGS: Record<EasingId, Easing> = {
  linear: (u) => u,
  smooth: (u) => u * u * (3 - 2 * u), // smoothstep
  accel: (u) => u * u, // yavaş başla
  decel: (u) => 1 - (1 - u) * (1 - u), // yavaş bitir
};

export function clamp01(u: number): number {
  return u < 0 ? 0 : u > 1 ? 1 : u;
}

export function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

export function lerpVec(a: Vec, b: Vec, u: number): Vec {
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) };
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function angle(from: Vec, to: Vec): number {
  // 0 = yukarı (-y), saat yönünde. facing göstergesi bu referansı kullanır.
  return Math.atan2(to.x - from.x, from.y - to.y);
}

/**
 * Bir track'i zaman t'de örnekler. Keyframe'ler artan t ile sıralı varsayılır.
 * t ilk keyframe'den küçükse ilk poz, sondan büyükse son poz döner.
 */
export function sampleTrack(track: EntityTrack, t: number): Vec {
  const kf = track.keyframes;
  if (kf.length === 0) return { x: 0.5, y: 0.5 };
  if (kf.length === 1 || t <= kf[0].t) return kf[0].pos;
  const last = kf[kf.length - 1];
  if (t >= last.t) return last.pos;

  // Aralığı bul (lineer tarama — keyframe sayısı küçük)
  let i = 0;
  while (i < kf.length - 1 && kf[i + 1].t <= t) i++;
  const a = kf[i];
  const b = kf[i + 1];
  const span = b.t - a.t;
  const u = span <= 0 ? 1 : clamp01((t - a.t) / span);
  const ease = EASINGS[b.ease ?? 'smooth'];
  return lerpVec(a.pos, b.pos, ease(u));
}

/** İki keyframe arası hız vektörünün yönü (facing için). Küçük ileri fark kullanır. */
export function sampleFacing(track: EntityTrack, t: number, prevPos: Vec): number {
  const ahead = sampleTrack(track, t + 60);
  if (dist(ahead, prevPos) < 0.001) return NaN; // hareket yok → facing koru
  return angle(prevPos, ahead);
}
