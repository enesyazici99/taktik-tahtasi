import { TIMING } from '../data/constants';
import type {
  CompiledScenario,
  EntityTrack,
  FrameState,
  ResolvedAnnotation,
  Vec,
} from '../types';
import { applyBehaviors, seedOf } from './behaviors';
import { resolveBall } from './ball';
import { angle, clamp01, dist, lerpVec, sampleTrack } from './interpolate';

// ============================================================================
// render(t): saf fonksiyon. Bir CompiledScenario + t → FrameState.
// Durum biriktirme yok. Aynı t her zaman aynı kareyi verir.
// ============================================================================

const BLEND = TIMING.blend;

function trackSpan(tr: EntityTrack): [number, number] {
  const k = tr.keyframes;
  return [k[0].t, k[k.length - 1].t];
}

/** Track çekirdek penceresinde mi (blend hariç)? */
function trackWeight(tr: EntityTrack, t: number): number {
  const [t0, t1] = trackSpan(tr);
  if (t >= t0 && t <= t1) return 1;
  if (t < t0) return t0 - t <= BLEND ? 1 - (t0 - t) / BLEND : 0;
  return t - t1 <= BLEND ? 1 - (t - t1) / BLEND : 0;
}

export function resolveFrame(sc: CompiledScenario, t: number): FrameState {
  const trackById: Record<string, EntityTrack> = {};
  for (const tr of sc.tracks) trackById[tr.id] = tr;

  const base = sc.formation.positions;
  const isUs = (id: string) => id.startsWith('u');
  const ownGoal: Vec = { x: 0.5, y: 1 }; // bizim kale

  // Birincil poz (ball & shadow hedefleri için yaklaşık): track aktifse tracked.
  const primary = (id: string): Vec => {
    const tr = trackById[id];
    if (tr && trackWeight(tr, t) >= 1) return sampleTrack(tr, t);
    return base[id] ?? { x: 0.5, y: 0.5 };
  };

  // Top
  const ball = resolveBall(sc.ball, t, primary, isUs);

  // Nihai oyuncu pozları
  const entities: FrameState['entities'] = {};
  for (const id of Object.keys(base)) {
    const seed = seedOf(id);
    const tr = trackById[id];
    const w = tr ? trackWeight(tr, t) : 0;

    let pos: Vec;
    if (w >= 1) {
      pos = sampleTrack(tr!, t);
    } else {
      const behPos = applyBehaviors(sc.behaviors[id], base[id], {
        t,
        seed,
        ball: ball.pos,
        ownGoal,
        posOf: primary,
      });
      pos = w > 0 ? lerpVec(behPos, sampleTrack(tr!, t), w) : behPos;
    }

    // Facing: kısa ileri farktan
    const ahead = w >= 1 && tr ? sampleTrack(tr, t + 70) : pos;
    const facing = dist(ahead, pos) > 0.0015 ? angle(pos, ahead) : NaN;
    entities[id] = { ...pos, facing };
  }

  // Anotasyonlar
  const activeAnnotations: ResolvedAnnotation[] = [];
  for (const a of sc.annotations) {
    if (t < a.t0 - 1 || t > a.t1 + 1) continue;
    const op = envelope(t, a.t0, a.t1);
    if (op <= 0.001) continue;
    switch (a.kind) {
      case 'passLine':
        activeAnnotations.push({
          kind: 'passLine',
          from: a.from,
          to: a.to,
          progress: clamp01((t - a.t0) / Math.max(1, a.t1 - a.t0)),
          opacity: op,
        });
        break;
      case 'runArrow':
        activeAnnotations.push({
          kind: 'runArrow',
          path: a.path,
          progress: clamp01((t - a.t0) / Math.max(1, a.t1 - a.t0)),
          opacity: op,
        });
        break;
      case 'zone':
        activeAnnotations.push({
          kind: 'zone',
          center: a.center,
          rx: a.rx,
          ry: a.ry,
          label: a.label,
          opacity: op,
        });
        break;
      case 'ring':
        activeAnnotations.push({
          kind: 'ring',
          pos: entities[a.playerId] ?? { x: 0.5, y: 0.5 },
          opacity: op,
        });
        break;
      case 'label':
        activeAnnotations.push({ kind: 'label', pos: a.pos, text: a.text, opacity: op });
        break;
    }
  }

  // Aktif faz
  let phaseIndex = 0;
  for (let i = 0; i < sc.phases.length; i++) {
    if (t >= sc.phases[i].t0) phaseIndex = i;
  }

  return { t, entities, ball, activeAnnotations, phaseIndex };
}

/** Başta/sonda yumuşak fade zarfı. */
function envelope(t: number, t0: number, t1: number, fade = 220): number {
  const inF = clamp01((t - t0) / fade);
  const outF = clamp01((t1 - t) / fade);
  return Math.min(inF, outF);
}
