import { describe, expect, it } from 'vitest';
import { compileScenario } from '../engine/compiler';
import { dist } from '../engine/interpolate';
import { resolveFrame } from '../engine/resolve';
import { SCENARIO_DEFS } from './index';

// Her senaryonun her adımında konumlandırma doğru mu? (deterministik, tarayıcısız)
describe('konumlandırma doğruluğu', () => {
  for (const def of SCENARIO_DEFS) {
    const sc = compileScenario(def);

    describe(sc.id, () => {
      it('taşınan top her zaman taşıyıcının ayağında', () => {
        for (const seg of sc.ball) {
          if (seg.kind !== 'carried') continue;
          const t = (seg.t0 + seg.t1) / 2;
          const f = resolveFrame(sc, t);
          const c = f.entities[seg.carrierId];
          expect(c, `taşıyıcı ${seg.carrierId} sahada`).toBeTruthy();
          expect(dist(f.ball.pos, c)).toBeLessThan(0.06);
        }
      });

      it('pas/uçuş topu doğru noktalardan geçirir', () => {
        for (const seg of sc.ball) {
          if (seg.kind !== 'flight') continue;
          const a = resolveFrame(sc, seg.t0 + 5);
          const b = resolveFrame(sc, seg.t1 - 5);
          expect(dist(a.ball.pos, seg.from)).toBeLessThan(0.08);
          expect(dist(b.ball.pos, seg.to)).toBeLessThan(0.08);
        }
      });

      it('her adım ortasında tüm oyuncular saha içinde', () => {
        for (const ph of sc.phases) {
          const f = resolveFrame(sc, (ph.t0 + ph.t1) / 2);
          for (const [id, e] of Object.entries(f.entities)) {
            expect(e.x, `${id} x`).toBeGreaterThanOrEqual(-0.02);
            expect(e.x, `${id} x`).toBeLessThanOrEqual(1.02);
            expect(e.y, `${id} y`).toBeGreaterThanOrEqual(-0.02);
            expect(e.y, `${id} y`).toBeLessThanOrEqual(1.02);
          }
        }
      });
    });
  }

  it('çıkış senaryolarında rakip YÜKSEK presler (geride kalmaz)', () => {
    for (const def of SCENARIO_DEFS.filter((d) => d.group === 'cikis')) {
      const sc = compileScenario(def);
      const f = resolveFrame(sc, sc.phases[0].t0 + 200);
      // Bizim kale y=1; rakibin bizim yarıya (y>0.5) basan en az 3 oyuncusu olmalı
      const pressers = Object.entries(f.entities).filter(
        ([id, e]) => id.startsWith('r') && !id.includes('K') && e.y > 0.5,
      );
      expect(pressers.length, `${sc.id} yüksek pres`).toBeGreaterThanOrEqual(3);
    }
  });

  it('hücum senaryolarında rakip GERİDE savunur (kendi yarısında)', () => {
    for (const def of SCENARIO_DEFS.filter((d) => d.group === 'hucum')) {
      const sc = compileScenario(def);
      const f = resolveFrame(sc, sc.phases[0].t0 + 200);
      // Rakip kalecisi hariç çoğunluğu üst yarıda (y<0.5) savunmada
      const deep = Object.entries(f.entities).filter(
        ([id, e]) => id.startsWith('r') && e.y < 0.55,
      );
      expect(deep.length, `${sc.id} geride savunma`).toBeGreaterThanOrEqual(5);
    }
  });
});
