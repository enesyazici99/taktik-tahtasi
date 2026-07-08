import { MAX_BALL_IDLE_MS, MAX_PLAYER_SPEED, SPEEDS, TIMING } from '../data/constants';
import { PLAYER_BY_ID } from '../data/roster';
import type {
  Annotation,
  BallSegment,
  CompiledScenario,
  EntityTrack,
  Keyframe,
  PlayerDef,
  Vec,
} from '../types';
import type { ActionNode, ScenarioDef } from './dsl';
import { DEFAULT_BEHAVIORS } from './dsl';
import { dist, sampleTrack } from './interpolate';

// ============================================================================
// Derleyici: DSL aksiyonları → CompiledScenario.
// - Süreler mesafeden hesaplanır (elle verilmez).
// - pass: top, alıcının VARIŞ anındaki pozuna uçar (iteratif çözüm).
// - Loop: reset koşusu otomatik (~1.2sn), ışınlanmasız.
// - Doğrulama: ışınlanma, sahipsiz top >300ms, saha dışı → anlaşılır hata.
// ============================================================================

export class CompileError extends Error {
  constructor(scenarioId: string, action: string, msg: string) {
    super(`[${scenarioId} / ${action}] ${msg}`);
    this.name = 'CompileError';
  }
}

interface Flight {
  t0: number;
  t1: number;
  from: Vec;
  to: Vec;
  arc: number;
  fromId: string;
  toId: string | null;
}

interface Ctx {
  sc: ScenarioDef;
  kf: Map<string, Keyframe[]>;
  flights: Flight[];
  annotations: Annotation[];
  pending: { ann: Annotation; phaseScoped: boolean }[]; // t1=Infinity → faz sonuna kadar
}

function speedOf(id: string | undefined): number {
  return SPEEDS[(id ?? 'jog') as keyof typeof SPEEDS] ?? SPEEDS.jog;
}

/** Verilen anda entity pozu: track varsa örnekle, yoksa formasyon. */
function posAt(ctx: Ctx, id: string, t: number): Vec {
  const kf = ctx.kf.get(id);
  if (kf && kf.length) return sampleTrack({ id, keyframes: kf }, t);
  const f = ctx.sc.formation.positions[id];
  return f ?? { x: 0.5, y: 0.5 };
}

function addKf(ctx: Ctx, id: string, t: number, pos: Vec, ease?: Keyframe['ease']): void {
  let arr = ctx.kf.get(id);
  if (!arr) {
    arr = [];
    ctx.kf.set(id, arr);
  }
  // Aynı zaman varsa üzerine yaz
  const existing = arr.find((k) => Math.abs(k.t - t) < 0.5);
  if (existing) {
    existing.pos = pos;
    if (ease) existing.ease = ease;
    return;
  }
  arr.push({ t, pos, ease });
  arr.sort((a, b) => a.t - b.t);
}

/** Entity hareketten önce başlangıç noktasında sabitlensin (anchor). */
function anchor(ctx: Ctx, id: string, t: number): Vec {
  const p = posAt(ctx, id, t);
  addKf(ctx, id, t, p);
  return p;
}

function inPitch(p: Vec): boolean {
  return p.x >= -0.02 && p.x <= 1.02 && p.y >= -0.02 && p.y <= 1.02;
}

// --- Aksiyon derleme: her aksiyon start alır, end döndürür ---
function compileAction(ctx: Ctx, a: ActionNode, start: number): number {
  const id = ctx.sc.id;
  switch (a.op) {
    case 'wait':
      return start + a.ms;

    case 'hold': {
      const p = anchor(ctx, a.id, start);
      addKf(ctx, a.id, start + a.ms, p);
      return start + a.ms;
    }

    case 'run': {
      const from = anchor(ctx, a.id, start);
      if (!inPitch(a.to)) throw new CompileError(id, `run ${a.id}`, `hedef saha dışı: ${fmt(a.to)}`);
      const d = dist(from, a.to);
      const dur = Math.max(1, (d / speedOf(a.opts.speed)) * 1000);
      const end = start + dur;
      addKf(ctx, a.id, end, a.to, 'smooth');
      if (a.opts.arrow) pushRunArrow(ctx, from, a.to, start, end);
      return end;
    }

    case 'dribble': {
      let from = anchor(ctx, a.id, start);
      let t = start;
      for (const pt of a.path) {
        if (!inPitch(pt)) throw new CompileError(id, `dribble ${a.id}`, `nokta saha dışı: ${fmt(pt)}`);
        const dur = Math.max(1, (dist(from, pt) / SPEEDS.dribble) * 1000);
        t += dur;
        addKf(ctx, a.id, t, pt, 'linear');
        from = pt;
      }
      return t;
    }

    case 'press': {
      const from = anchor(ctx, a.id, start);
      const target = posAt(ctx, a.targetId, start);
      // Kavisli yol: orta noktayı yana kaydır
      const mid: Vec = {
        x: (from.x + target.x) / 2 + (target.y - from.y) * a.curve,
        y: (from.y + target.y) / 2 - (target.x - from.x) * a.curve,
      };
      const total = dist(from, mid) + dist(mid, target);
      const dur = Math.max(1, (total / SPEEDS.sprint) * 1000);
      addKf(ctx, a.id, start + dur * 0.5, mid, 'smooth');
      addKf(ctx, a.id, start + dur, target, 'decel');
      return start + dur;
    }

    case 'pass':
    case 'longPass': {
      const from = anchor(ctx, a.from, start);
      const speed = a.op === 'longPass' ? SPEEDS.longPass : SPEEDS.pass;
      const arc = a.op === 'longPass' ? 1 : (a.opts.arc ?? 0);
      // Alıcının varış pozunu iteratif çöz
      let arrival = start + (dist(from, posAt(ctx, a.to, start)) / speed) * 1000;
      let target = posAt(ctx, a.to, arrival);
      for (let i = 0; i < 4; i++) {
        arrival = start + (dist(from, target) / speed) * 1000;
        target = posAt(ctx, a.to, arrival);
      }
      arrival = Math.max(start + 1, arrival);
      if (!inPitch(target)) throw new CompileError(id, `${a.op} ${a.from}→${a.to}`, `hedef saha dışı: ${fmt(target)}`);
      ctx.flights.push({ t0: start, t1: arrival, from, to: target, arc, fromId: a.from, toId: a.to });
      ctx.annotations.push({ kind: 'passLine', t0: start, t1: arrival, from, to: target });
      // Alıcıyı topun varış noktasında sabitle (yoksa davranış çeker)
      if (!ctx.kf.has(a.to)) anchor(ctx, a.to, start);
      addKf(ctx, a.to, arrival, target);
      if (a.opts.oneTouch) {
        // Alıcı 120ms sonra tekrar hareket edebilir; burada sadece kısa hold
        addKf(ctx, a.to, arrival + TIMING.oneTouch, target);
      }
      return arrival;
    }

    case 'shoot': {
      const from = anchor(ctx, a.from, start);
      if (!inPitch(a.target)) throw new CompileError(id, `shoot ${a.from}`, `hedef saha dışı: ${fmt(a.target)}`);
      const arrival = start + (dist(from, a.target) / SPEEDS.shot) * 1000;
      ctx.flights.push({ t0: start, t1: arrival, from, to: a.target, arc: 0.3, fromId: a.from, toId: null });
      ctx.annotations.push({ kind: 'passLine', t0: start, t1: arrival, from, to: a.target });
      return arrival;
    }

    case 'clear': {
      const from = anchor(ctx, a.from, start);
      const target: Vec = { x: clamp01(from.x + a.dir.x), y: clamp01(from.y + a.dir.y) };
      const arrival = start + (dist(from, target) / SPEEDS.longPass) * 1000;
      ctx.flights.push({ t0: start, t1: arrival, from, to: target, arc: 0.8, fromId: a.from, toId: null });
      return arrival;
    }

    case 'runArrow': {
      const kf = ctx.kf.get(a.id);
      if (kf && kf.length >= 2) {
        const last = kf[kf.length - 1];
        const prev = kf[kf.length - 2];
        pushRunArrow(ctx, prev.pos, last.pos, prev.t, last.t);
      }
      return start;
    }

    case 'zone': {
      ctx.pending.push({
        ann: { kind: 'zone', t0: start, t1: a.ms ? start + a.ms : Infinity, center: a.center, rx: a.rx, ry: a.ry, label: a.label },
        phaseScoped: a.ms == null,
      });
      return start;
    }
    case 'ring': {
      ctx.pending.push({
        ann: { kind: 'ring', t0: start, t1: a.ms ? start + a.ms : Infinity, playerId: a.id },
        phaseScoped: a.ms == null,
      });
      return start;
    }
    case 'label': {
      ctx.pending.push({
        ann: { kind: 'label', t0: start, t1: a.ms ? start + a.ms : Infinity, pos: a.pos, text: a.text },
        phaseScoped: a.ms == null,
      });
      return start;
    }

    case 'seq': {
      let t = start;
      for (const c of a.children) t = compileAction(ctx, c, t);
      return t;
    }
    case 'par': {
      let end = start;
      // Hareket aksiyonlarını önce, pass'leri sonra derle (pass alıcı track'ini görsün)
      const movers = a.children.filter((c) => c.op !== 'pass' && c.op !== 'longPass');
      const passes = a.children.filter((c) => c.op === 'pass' || c.op === 'longPass');
      for (const c of [...movers, ...passes]) {
        end = Math.max(end, compileAction(ctx, c, start));
      }
      return end;
    }
  }
}

function pushRunArrow(ctx: Ctx, from: Vec, to: Vec, runStart: number, runEnd: number): void {
  ctx.annotations.push({
    kind: 'runArrow',
    t0: Math.max(0, runStart - TIMING.runArrowLead),
    t1: runEnd,
    path: [from, to],
  });
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function fmt(p: Vec): string {
  return `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;
}

// ---------------------------------------------------------------------------
export function compileScenario(def: ScenarioDef): CompiledScenario {
  const ctx: Ctx = {
    sc: def,
    kf: new Map(),
    flights: [],
    annotations: [],
    pending: [],
  };

  const phases: CompiledScenario['phases'] = [];
  let cursor = 0;

  for (let i = 0; i < def.phases.length; i++) {
    const ph = def.phases[i];
    const t0 = cursor;
    // Faz aksiyonları örtük seq
    let t = t0;
    for (const act of ph.actions) t = compileAction(ctx, act, t);
    const t1 = Math.max(t, t0 + 1);
    // Bu fazda açık kalan (Infinity) anotasyonları faz sonuna kilitle
    for (const p of ctx.pending) {
      if (p.phaseScoped && !isFinite(p.ann.t1)) {
        (p.ann as { t1: number }).t1 = t1;
      }
    }
    flushPending(ctx);
    phases.push({ id: ph.title.toLowerCase().replace(/\s+/g, '-') + '-' + i, title: ph.title, note: ph.note, t0, t1 });
    cursor = t1;
  }

  const actionsEnd = cursor;

  // İlk taşıyıcı
  const initialCarrier = resolveInitialCarrier(ctx, def);

  // --- Reset koşusu: yer değiştiren herkes formasyona döner (ışınlanmasız) ---
  // Reset penceresi en uzak dönüşe göre ölçeklenir → kimse sprint üstüne çıkmaz.
  const displaced: { id: string; lastPos: Vec; lastT: number; home: Vec }[] = [];
  let maxResetDist = 0;
  for (const [id, kf] of ctx.kf) {
    if (!kf.length) continue;
    const last = kf[kf.length - 1];
    const home = def.formation.positions[id];
    if (!home) continue;
    const d = dist(last.pos, home);
    if (d > 0.005) {
      displaced.push({ id, lastPos: last.pos, lastT: last.t, home });
      maxResetDist = Math.max(maxResetDist, d);
    }
  }
  const resetDur = Math.max(TIMING.resetRun, (maxResetDist / SPEEDS.jog) * 1000);
  const duration = actionsEnd + resetDur;
  for (const d of displaced) {
    if (d.lastT < actionsEnd) addKf(ctx, d.id, actionsEnd, d.lastPos);
    addKf(ctx, d.id, duration, d.home, 'decel');
  }

  // --- Top segmentleri: flight'lar + carried dolgular + reset top uçuşu ---
  const ball = synthesizeBall(ctx, def, initialCarrier, actionsEnd, duration);

  // --- Track'leri üret ---
  const tracks: EntityTrack[] = [];
  for (const [id, keyframes] of ctx.kf) {
    if (keyframes.length) tracks.push({ id, keyframes });
  }

  // --- Doğrulama ---
  validate(def, tracks, ball);

  const players: PlayerDef[] = Object.keys(def.formation.positions)
    .map((id) => PLAYER_BY_ID[id])
    .filter(Boolean);

  return {
    id: def.id,
    title: def.title,
    group: def.group,
    duration,
    formation: def.formation,
    players,
    tracks,
    behaviors: def.behaviors ?? DEFAULT_BEHAVIORS,
    ball,
    annotations: ctx.annotations,
    phases,
  };
}

function flushPending(ctx: Ctx): void {
  for (const p of ctx.pending) {
    if (isFinite(p.ann.t1)) ctx.annotations.push(p.ann);
  }
  ctx.pending = [];
}

function resolveInitialCarrier(ctx: Ctx, def: ScenarioDef): string {
  if (def.ballStart) return def.ballStart;
  const sorted = ctx.flights.slice().sort((a, b) => a.t0 - b.t0);
  if (sorted.length) return sorted[0].fromId;
  return 'uK';
}

function synthesizeBall(
  ctx: Ctx,
  def: ScenarioDef,
  initialCarrier: string,
  actionsEnd: number,
  duration: number,
): BallSegment[] {
  const flights = ctx.flights.slice().sort((a, b) => a.t0 - b.t0);
  const out: BallSegment[] = [];
  let prevEnd = 0;
  let carrier: string | null = initialCarrier;

  for (const f of flights) {
    if (f.t0 > prevEnd + 0.5) {
      if (carrier == null) {
        throw new CompileError(def.id, 'top', `sahipsiz top ${Math.round(f.t0 - prevEnd)}ms boşta (t=${Math.round(prevEnd)})`);
      }
      out.push({ kind: 'carried', t0: prevEnd, t1: f.t0, carrierId: carrier });
    }
    out.push({ kind: 'flight', t0: f.t0, t1: f.t1, from: f.from, to: f.to, arc: f.arc });
    prevEnd = f.t1;
    carrier = f.toId;
  }

  // Son flight'tan sonra: reset top uçuşu — topu başlangıç konumuna geri getir
  const homePos = def.formation.positions[initialCarrier] ?? { x: 0.5, y: 0.9 };
  const ballPosAtEnd = prevEnd > 0 && flights.length ? flights[flights.length - 1].to : homePos;
  if (carrier != null && prevEnd < actionsEnd - 0.5) {
    // Hâlâ taşınıyor: actionsEnd'e kadar carried, sonra reset uçuşu
    out.push({ kind: 'carried', t0: prevEnd, t1: actionsEnd, carrierId: carrier });
    prevEnd = actionsEnd;
  }
  const from = carrier != null ? posAt(ctx, carrier, prevEnd) : ballPosAtEnd;
  out.push({ kind: 'flight', t0: prevEnd, t1: duration, from, to: homePos, arc: 0.15 });

  return out;
}

function validate(def: ScenarioDef, tracks: EntityTrack[], ball: BallSegment[]): void {
  // Işınlanma + saha dışı
  for (const tr of tracks) {
    for (let i = 0; i < tr.keyframes.length; i++) {
      const k = tr.keyframes[i];
      if (!inPitch(k.pos)) {
        throw new CompileError(def.id, `track ${tr.id}`, `keyframe saha dışı t=${Math.round(k.t)} ${fmt(k.pos)}`);
      }
      if (i > 0) {
        const p = tr.keyframes[i - 1];
        const dt = (k.t - p.t) / 1000;
        if (dt <= 0) continue;
        const sp = dist(p.pos, k.pos) / dt;
        if (sp > MAX_PLAYER_SPEED + 1e-6) {
          throw new CompileError(
            def.id,
            `track ${tr.id}`,
            `ışınlanma: hız ${sp.toFixed(3)} > ${MAX_PLAYER_SPEED} (t=${Math.round(p.t)}→${Math.round(k.t)})`,
          );
        }
      }
    }
  }
  // Sahipsiz top boşluğu
  const sorted = ball.slice().sort((a, b) => a.t0 - b.t0);
  let prev = 0;
  for (const s of sorted) {
    if (s.t0 - prev > MAX_BALL_IDLE_MS) {
      throw new CompileError(def.id, 'top', `sahipsiz top boşluğu ${Math.round(s.t0 - prev)}ms (t=${Math.round(prev)})`);
    }
    prev = Math.max(prev, s.t1);
  }
}
