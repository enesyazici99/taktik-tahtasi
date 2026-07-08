import { describe, expect, it } from 'vitest';
import { F323 } from '../data/formations';
import { MAX_PLAYER_SPEED, TIMING } from '../data/constants';
import { compileScenario, CompileError } from './compiler';
import { hold, phase, run, scenario, seq, v } from './dsl';
import { dist } from './interpolate';
import { resolveFrame } from './resolve';
import c1 from '../scenarios/cikis/c1-ucuncu-adam';

describe('C1 derleme', () => {
  const sc = compileScenario(c1);

  it('fazlar ardışık ve süre reset içeriyor', () => {
    expect(sc.phases.length).toBe(3);
    for (let i = 1; i < sc.phases.length; i++) {
      expect(sc.phases[i].t0).toBe(sc.phases[i - 1].t1);
    }
    const lastPhaseEnd = sc.phases[sc.phases.length - 1].t1;
    // Reset penceresi en uzak dönüşe göre ölçeklenir → en az resetRun kadar.
    expect(sc.duration).toBeGreaterThanOrEqual(lastPhaseEnd + TIMING.resetRun - 1);
  });

  it('top her an ya taşınır ya uçar (300ms boşluk yok)', () => {
    const sorted = sc.ball.slice().sort((a, b) => a.t0 - b.t0);
    let prev = 0;
    for (const s of sorted) {
      expect(s.t0 - prev).toBeLessThanOrEqual(300);
      prev = Math.max(prev, s.t1);
    }
    expect(prev).toBeGreaterThanOrEqual(sc.duration - 1);
  });

  it('hiçbir oyuncu ışınlanmaz', () => {
    for (const tr of sc.tracks) {
      for (let i = 1; i < tr.keyframes.length; i++) {
        const a = tr.keyframes[i - 1];
        const b = tr.keyframes[i];
        const dt = (b.t - a.t) / 1000;
        if (dt <= 0) continue;
        expect(dist(a.pos, b.pos) / dt).toBeLessThanOrEqual(MAX_PLAYER_SPEED + 1e-6);
      }
    }
  });

  it('loop ışınlanmasız: t=0 ve t=duration neredeyse aynı', () => {
    const a = resolveFrame(sc, 0);
    const b = resolveFrame(sc, sc.duration);
    for (const id of Object.keys(a.entities)) {
      expect(dist(a.entities[id], b.entities[id])).toBeLessThan(0.03);
    }
  });

  it('pas topu alıcıya ulaştırır', () => {
    // İlk pas: uK→u3. Uçuş bitince top u3 pozunda.
    const flight = sc.ball.find((s) => s.kind === 'flight')!;
    const at = resolveFrame(sc, (flight as { t1: number }).t1);
    // Top u3 civarında (carried'e geçmiş olmalı)
    expect(Math.abs(at.ball.pos.x - at.entities.u3.x)).toBeLessThan(0.05);
  });
});

describe('derleyici doğrulama', () => {
  it('ışınlanmada hata fırlatır', () => {
    const bad = scenario({
      id: 'bad', title: 'x', group: 'hucum', formation: F323,
      phases: [phase('p', 'n', [
        // 0.9 mesafe 100ms'de → imkânsız hız (elle keyframe simülasyonu: iki hızlı run)
        seq(hold('u8', 0), run('u8', v(0.95, 0.05), { speed: 'shot' })),
      ])],
    });
    expect(() => compileScenario(bad)).toThrow(CompileError);
  });

  it('saha dışı hedefte hata fırlatır', () => {
    const bad = scenario({
      id: 'bad2', title: 'x', group: 'hucum', formation: F323,
      phases: [phase('p', 'n', [run('u8', v(1.5, 0.5))])],
    });
    expect(() => compileScenario(bad)).toThrow(CompileError);
  });
});
