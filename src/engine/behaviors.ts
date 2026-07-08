import { IDLE } from '../data/constants';
import type { Behavior, Vec } from '../types';

// ============================================================================
// Davranış katmanı — track'i o an boş olan oyuncular yaşasın diye.
// HEPSİ saf: sadece (t, base, ball...) girdilerinden türetilir. Math.random YOK.
// idleSway dahil her salınım t'den gelir → scrubber/loop kusursuz.
// ============================================================================

/** id'den deterministik faz tohumu (string hash). */
export function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1000 / 1000; // 0..1
}

/** t tabanlı hafif salınım — kimse heykel gibi durmaz. */
export function idleSway(base: Vec, t: number, seed: number, amp: number): Vec {
  const ph = seed * Math.PI * 2;
  return {
    x: base.x + Math.sin(t * IDLE.freq + ph) * amp,
    y: base.y + Math.cos(t * IDLE.freq * 0.8 + ph * 1.7) * amp * 0.7,
  };
}

/** Topun konumuna göre hat bazlı blok kayması. */
export function blockShift(base: Vec, ball: Vec, fx: number, fy: number): Vec {
  const dx = (ball.x - 0.5) * fx;
  // y: top ilerledikçe hat topa doğru kompaktlaşır
  const dy = (ball.y - base.y) * fy;
  return { x: base.x + dx, y: base.y + dy };
}

/** Bir hedefi kale ile aramızda gölgeleme (ofsayt yok imzası). */
export function shadowMark(target: Vec, goal: Vec, offset: Vec): Vec {
  // Hedef ile kendi kalemiz arasında, hedefin biraz kale tarafında dur
  return {
    x: clamp01(target.x + offset.x),
    y: clamp01(target.y + offset.y + (goal.y - target.y) * 0.06),
  };
}

/** Topu bir tarafa yönlendiren kavisli pres koşusu. */
export function chaseBall(base: Vec, ball: Vec, fx: number, minY?: number): Vec {
  // Topa doğru yaklaş ama kavis için x'i abart, ekseni koru
  const tx = ball.x + (ball.x - 0.5) * 0.15 * fx;
  const ty = minY != null ? Math.max(minY, ball.y + 0.06) : ball.y + 0.06;
  return {
    x: clamp01(base.x + (tx - base.x) * 0.72),
    y: clamp01(base.y + (ty - base.y) * 0.72),
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Bir davranış listesini uygula: sıradaki her davranış base'i günceller. */
export function applyBehaviors(
  behaviors: Behavior[] | undefined,
  base: Vec,
  ctx: { t: number; seed: number; ball: Vec; ownGoal: Vec; posOf: (id: string) => Vec },
): Vec {
  if (!behaviors || behaviors.length === 0) {
    return idleSway(base, ctx.t, ctx.seed, IDLE.amp);
  }
  let pos = base;
  let swayed = false;
  for (const b of behaviors) {
    switch (b.kind) {
      case 'idleSway':
        pos = idleSway(pos, ctx.t, ctx.seed, b.amp);
        swayed = true;
        break;
      case 'blockShift':
        pos = blockShift(pos, ctx.ball, b.fx, b.fy);
        break;
      case 'shadowMark':
        pos = shadowMark(ctx.posOf(b.targetId), ctx.ownGoal, b.offset);
        break;
      case 'chaseBall':
        pos = chaseBall(pos, ctx.ball, b.fx, b.minY);
        break;
    }
  }
  // Davranışların üstüne her zaman minik idleSway (canlılık)
  if (!swayed) pos = idleSway(pos, ctx.t, ctx.seed, IDLE.amp * 0.6);
  return pos;
}
