import { describe, expect, it } from 'vitest';
import { MAX_PLAYER_SPEED } from '../data/constants';
import { compileScenario } from '../engine/compiler';
import { dist } from '../engine/interpolate';
import { resolveFrame } from '../engine/resolve';
import { SCENARIO_DEFS } from './index';

// Tüm katalog: her senaryo derlenmeli ve doğrulamaları temiz geçmeli.
describe('senaryo kataloğu', () => {
  it('16 senaryo tanımlı', () => {
    expect(SCENARIO_DEFS.length).toBe(16);
  });

  for (const def of SCENARIO_DEFS) {
    describe(def.id, () => {
      const sc = compileScenario(def); // hata fırlatırsa test patlar

      it('en az 2 faz ve her fazın koçluk notu var', () => {
        expect(sc.phases.length).toBeGreaterThanOrEqual(2);
        for (const p of sc.phases) {
          expect(p.title.length).toBeGreaterThan(0);
          expect(p.note.length).toBeGreaterThan(0);
        }
      });

      it('top hiçbir an 300ms boşta değil', () => {
        const sorted = sc.ball.slice().sort((a, b) => a.t0 - b.t0);
        let prev = 0;
        for (const s of sorted) {
          expect(s.t0 - prev).toBeLessThanOrEqual(300);
          prev = Math.max(prev, s.t1);
        }
        expect(prev).toBeGreaterThanOrEqual(sc.duration - 1);
      });

      it('ışınlanma yok', () => {
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

      it('loop ışınlanmasız (t=0 ≈ t=duration)', () => {
        const a = resolveFrame(sc, 0);
        const b = resolveFrame(sc, sc.duration);
        for (const id of Object.keys(a.entities)) {
          expect(dist(a.entities[id], b.entities[id])).toBeLessThan(0.05);
        }
      });

      it('tüm keyframe pozları saha içinde', () => {
        for (const tr of sc.tracks) {
          for (const k of tr.keyframes) {
            expect(k.pos.x).toBeGreaterThanOrEqual(-0.02);
            expect(k.pos.x).toBeLessThanOrEqual(1.02);
            expect(k.pos.y).toBeGreaterThanOrEqual(-0.02);
            expect(k.pos.y).toBeLessThanOrEqual(1.02);
          }
        }
      });
    });
  }
});
