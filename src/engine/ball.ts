import type { BallSegment, Vec } from '../types';
import { clamp01, lerpVec } from './interpolate';

// ============================================================================
// Top modeli. carried: taşıyıcıya bağlı, dribble salınımı. flight: arc ile
// sahte yükseklik (yarıçap büyür, gölge küçülür). Hepsi t'den türetilir.
// ============================================================================

export interface BallFrame {
  pos: Vec;
  radius: number; // 1 = normal
  shadow: number; // gölge ölçeği (1 = zeminde)
  trail: Vec[];
  carried: boolean;
}

/** Verilen anda topun konumunu döndürür (iz hesabı için de kullanılır). */
export function ballPosAt(
  segments: BallSegment[],
  t: number,
  posOf: (id: string) => Vec,
  isUs: (id: string) => boolean,
): Vec {
  const seg = pickSegment(segments, t);
  if (!seg) {
    // Segment yoksa: en yakın segmentin ucuna tutun
    return { x: 0.5, y: 0.5 };
  }
  if (seg.kind === 'carried') {
    const c = posOf(seg.carrierId);
    const dir = isUs(seg.carrierId) ? -1 : 1; // biz yukarı, rakip aşağı
    const sway = Math.sin(t * 0.02) * 0.004;
    return { x: c.x + sway, y: clamp01(c.y + dir * 0.02) };
  }
  const u = seg.t1 <= seg.t0 ? 1 : clamp01((t - seg.t0) / (seg.t1 - seg.t0));
  return lerpVec(seg.from, seg.to, u);
}

function pickSegment(segments: BallSegment[], t: number): BallSegment | null {
  let chosen: BallSegment | null = null;
  for (const s of segments) {
    if (t >= s.t0 && t <= s.t1) return s;
    if (t > s.t1) chosen = s; // geçmişteki son segmentte kal
  }
  return chosen ?? (segments.length ? segments[0] : null);
}

export function resolveBall(
  segments: BallSegment[],
  t: number,
  posOf: (id: string) => Vec,
  isUs: (id: string) => boolean,
): BallFrame {
  const seg = pickSegment(segments, t);
  const pos = ballPosAt(segments, t, posOf, isUs);
  let radius = 1;
  let shadow = 1;
  let carried = true;

  if (seg && seg.kind === 'flight') {
    carried = false;
    const u = seg.t1 <= seg.t0 ? 1 : clamp01((t - seg.t0) / (seg.t1 - seg.t0));
    // Parabolik yükseklik hissi
    const h = Math.sin(u * Math.PI) * seg.arc;
    radius = 1 + 0.8 * h;
    shadow = 1 - 0.45 * h;
  }

  // İz: son ~200ms
  const trail: Vec[] = [];
  for (let i = 1; i <= 4; i++) {
    trail.push(ballPosAt(segments, t - i * 50, posOf, isUs));
  }

  return { pos, radius, shadow, trail, carried };
}
