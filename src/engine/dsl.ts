import type { Behavior, GroupId, Formation, Vec } from '../types';
import type { SpeedId } from '../data/constants';

// ============================================================================
// Senaryo DSL — okunabilir aksiyonlar. Derleyici (compiler.ts) bunları
// CompiledScenario'ya çevirir. Keyframe elle yazılmaz.
// ============================================================================

export function v(x: number, y: number): Vec {
  return { x, y };
}

export interface RunOpts {
  speed?: SpeedId;
  arrow?: boolean; // koşu oku göster
  arrive?: 'beforeBall';
}
export interface PassOpts {
  oneTouch?: boolean;
  arc?: number;
}

export type ActionNode =
  | { op: 'hold'; id: string; ms: number }
  | { op: 'wait'; ms: number }
  | { op: 'run'; id: string; to: Vec; opts: RunOpts }
  | { op: 'dribble'; id: string; path: Vec[] }
  | { op: 'press'; id: string; targetId: string; curve: number }
  | { op: 'pass'; from: string; to: string; opts: PassOpts }
  | { op: 'longPass'; from: string; to: string; opts: PassOpts }
  | { op: 'shoot'; from: string; target: Vec }
  | { op: 'clear'; from: string; dir: Vec }
  | { op: 'runArrow'; id: string }
  | { op: 'zone'; center: Vec; rx: number; ry: number; label?: string; ms?: number }
  | { op: 'ring'; id: string; ms?: number }
  | { op: 'label'; pos: Vec; text: string; ms?: number }
  | { op: 'seq'; children: ActionNode[] }
  | { op: 'par'; children: ActionNode[] };

// --- Aksiyon kurucuları ---
export const hold = (id: string, ms: number): ActionNode => ({ op: 'hold', id, ms });
export const wait = (ms: number): ActionNode => ({ op: 'wait', ms });
export const run = (id: string, to: Vec, opts: RunOpts = {}): ActionNode => ({ op: 'run', id, to, opts });
export const dribble = (id: string, path: Vec[]): ActionNode => ({ op: 'dribble', id, path });
export const press = (id: string, targetId: string, curve = 0.12): ActionNode => ({ op: 'press', id, targetId, curve });
export const pass = (from: string, to: string, opts: PassOpts = {}): ActionNode => ({ op: 'pass', from, to, opts });
export const longPass = (from: string, to: string, opts: PassOpts = {}): ActionNode => ({ op: 'longPass', from, to, opts });
export const shoot = (from: string, target: Vec): ActionNode => ({ op: 'shoot', from, target });
export const clear = (from: string, dir: Vec): ActionNode => ({ op: 'clear', from, dir });
export const runArrow = (id: string): ActionNode => ({ op: 'runArrow', id });
export const zone = (center: Vec, rx: number, ry: number, label?: string, ms?: number): ActionNode => ({ op: 'zone', center, rx, ry, label, ms });
export const ring = (id: string, ms?: number): ActionNode => ({ op: 'ring', id, ms });
export const label = (pos: Vec, text: string, ms?: number): ActionNode => ({ op: 'label', pos, text, ms });
export const seq = (...children: ActionNode[]): ActionNode => ({ op: 'seq', children });
export const par = (...children: ActionNode[]): ActionNode => ({ op: 'par', children });

// --- Faz + senaryo ---
export interface PhaseDef {
  title: string;
  note: string;
  actions: ActionNode[];
}

export function phase(title: string, note: string, actions: ActionNode[]): PhaseDef {
  return { title, note, actions };
}

export interface ScenarioDef {
  id: string;
  title: string;
  group: GroupId;
  formation: Formation;
  behaviors?: Record<string, Behavior[]>;
  ballStart?: string; // topu ilk taşıyan (opsiyonel; aksi halde ilk pas'tan çıkarılır)
  phases: PhaseDef[];
}

export function scenario(def: ScenarioDef): ScenarioDef {
  return def;
}

// Standart davranış seti: idleSway herkese (varsayılan), 5 → r9 gölgeleme.
// Savunma bloğu senaryo bazında eklenir.
export function defaultBehaviors(extra: Record<string, Behavior[]> = {}): Record<string, Behavior[]> {
  return {
    u5: [{ kind: 'shadowMark', targetId: 'r9', offset: { x: 0.0, y: 0.05 } }],
    ...extra,
  };
}

export const DEFAULT_BEHAVIORS = defaultBehaviors();
