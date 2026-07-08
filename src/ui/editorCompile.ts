import { PLAYER_BY_ID } from '../data/roster';
import type { BallSegment, CompiledScenario, EntityTrack, Keyframe, Vec } from '../types';

// ============================================================================
// Editör kare-tabanlı model → CompiledScenario. Kareler arası lineer geçiş;
// top taşıyıcı değişince uçuş, değişmeyince taşınır. Sonda loop reset.
// ============================================================================

export interface EditorFrame {
  positions: Record<string, Vec>;
  ball: string; // taşıyıcı id
  note?: string;
  title?: string;
}

export interface EditorDoc {
  id: string;
  title: string;
  frames: EditorFrame[];
  frameMs: number; // kare başına süre
}

export function compileFrames(doc: EditorDoc): CompiledScenario {
  const frames = doc.frames;
  const step = Math.max(300, doc.frameMs || 1500);
  const ids = frames.length ? Object.keys(frames[0].positions) : [];

  // Zaman çizgisi: her kare bir zaman noktası; sona reset (kare 0'a dön)
  const times = frames.map((_, i) => i * step);
  const resetT = frames.length * step;
  const duration = resetT + step;

  const tracks: EntityTrack[] = ids.map((id) => {
    const kf: Keyframe[] = frames.map((f, i) => ({ t: times[i], pos: f.positions[id] ?? { x: 0.5, y: 0.5 } }));
    kf.push({ t: duration, pos: frames[0].positions[id] ?? { x: 0.5, y: 0.5 }, ease: 'smooth' });
    return { id, keyframes: kf };
  });

  // Top segmentleri
  const ball: BallSegment[] = [];
  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i];
    const b = frames[i + 1];
    if (a.ball === b.ball) {
      ball.push({ kind: 'carried', t0: times[i], t1: times[i + 1], carrierId: a.ball });
    } else {
      const from = a.positions[a.ball] ?? { x: 0.5, y: 0.5 };
      const to = b.positions[b.ball] ?? { x: 0.5, y: 0.5 };
      ball.push({ kind: 'flight', t0: times[i], t1: times[i + 1], from, to, arc: 0 });
    }
  }
  // Son kare → reset: taşınır, sonra kare 0 taşıyıcısına dön
  const last = frames[frames.length - 1];
  ball.push({ kind: 'carried', t0: times[times.length - 1], t1: resetT, carrierId: last.ball });
  const resetFrom = last.positions[last.ball] ?? { x: 0.5, y: 0.5 };
  const resetTo = frames[0].positions[frames[0].ball] ?? resetFrom;
  ball.push({ kind: 'flight', t0: resetT, t1: duration, from: resetFrom, to: resetTo, arc: 0.15 });

  const phases = frames.map((f, i) => ({
    id: `kare-${i}`,
    title: f.title || `Kare ${i + 1}`,
    note: f.note || 'Özel senaryo karesi.',
    t0: times[i],
    t1: i < frames.length - 1 ? times[i + 1] : resetT,
  }));

  return {
    id: doc.id,
    title: doc.title,
    group: 'hucum',
    duration,
    formation: { id: 'custom', name: doc.title, positions: frames[0].positions },
    players: ids.map((id) => PLAYER_BY_ID[id]).filter(Boolean),
    tracks,
    behaviors: {}, // editör kareleri tam kontrol; davranış yok
    ball,
    annotations: [],
    phases,
  };
}
