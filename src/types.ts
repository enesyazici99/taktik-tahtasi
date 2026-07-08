// ============================================================================
// Çekirdek veri modeli — tüm uygulama bu tiplere dayanır.
// Koordinatlar normalize: x ∈ [0,1] sol→sağ, y ∈ [0,1] üst→alt.
// Bizim kale y=1 tarafında (her zaman altta).
// ============================================================================

export type Vec = { x: number; y: number };

export type Team = 'us' | 'them';

export type GroupId = 'hucum' | 'pres' | 'cikis' | 'savunma' | 'gecis';

export interface PlayerDef {
  id: string;
  team: Team;
  label: string;
  gk?: boolean;
}

export interface Formation {
  id: string;
  name: string;
  positions: Record<string, Vec>;
}

export type EasingId = 'linear' | 'smooth' | 'accel' | 'decel';

export interface Keyframe {
  t: number; // ms, senaryo içi mutlak
  pos: Vec;
  ease?: EasingId;
}

export interface EntityTrack {
  id: string;
  keyframes: Keyframe[];
}

// --- Davranışlar (track'i boş olan anlar için) ---
export type Behavior =
  | { kind: 'idleSway'; amp: number }
  | { kind: 'blockShift'; fx: number; fy: number }
  | { kind: 'shadowMark'; targetId: string; offset: Vec }
  | { kind: 'chaseBall'; fx: number; minY?: number };

// --- Top ---
export type BallSegment =
  | { kind: 'carried'; t0: number; t1: number; carrierId: string }
  | { kind: 'flight'; t0: number; t1: number; from: Vec; to: Vec; arc: number };

// --- Anotasyonlar ---
export type Annotation =
  | { kind: 'passLine'; t0: number; t1: number; from: Vec; to: Vec }
  | { kind: 'runArrow'; t0: number; t1: number; path: Vec[] }
  | { kind: 'zone'; t0: number; t1: number; center: Vec; rx: number; ry: number; label?: string }
  | { kind: 'ring'; t0: number; t1: number; playerId: string }
  | { kind: 'label'; t0: number; t1: number; pos: Vec; text: string };

export interface Phase {
  id: string;
  title: string;
  note: string;
  t0: number;
  t1: number;
}

export interface CompiledScenario {
  id: string;
  title: string;
  group: GroupId;
  duration: number; // ms
  formation: Formation;
  players: PlayerDef[];
  tracks: EntityTrack[];
  behaviors: Record<string, Behavior[]>;
  ball: BallSegment[];
  annotations: Annotation[];
  phases: Phase[];
}

// Render için bir kareye ait çözülmüş durum
export interface FrameState {
  t: number;
  entities: Record<string, Vec & { facing: number }>;
  ball: { pos: Vec; radius: number; shadow: number; trail: Vec[] };
  activeAnnotations: ResolvedAnnotation[];
  phaseIndex: number;
}

export type ResolvedAnnotation =
  | { kind: 'passLine'; from: Vec; to: Vec; progress: number; opacity: number }
  | { kind: 'runArrow'; path: Vec[]; progress: number; opacity: number }
  | { kind: 'zone'; center: Vec; rx: number; ry: number; label?: string; opacity: number }
  | { kind: 'ring'; pos: Vec; opacity: number }
  | { kind: 'label'; pos: Vec; text: string; opacity: number };
