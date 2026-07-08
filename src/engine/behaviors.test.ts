import { describe, expect, it } from 'vitest';
import { F341 } from '../data/formations';
import { compileScenario } from './compiler';
import { defenseBlock, hold, par, pass, phase, run, scenario, seq, v } from './dsl';
import { resolveFrame } from './resolve';
import { blockShift, shadowMark } from './behaviors';

describe('davranış birimleri', () => {
  it('blockShift topa doğru kayar', () => {
    const base = { x: 0.3, y: 0.8 };
    const left = blockShift(base, { x: 0.1, y: 0.5 }, 0.3, 0.06);
    const right = blockShift(base, { x: 0.9, y: 0.5 }, 0.3, 0.06);
    expect(left.x).toBeLessThan(base.x);
    expect(right.x).toBeGreaterThan(base.x);
  });

  it('shadowMark hedef ile kale arasında kalır', () => {
    const target = { x: 0.5, y: 0.6 };
    const goal = { x: 0.5, y: 1 };
    const m = shadowMark(target, goal, { x: 0, y: 0.05 });
    expect(m.y).toBeGreaterThan(target.y); // kaleye (aşağı) doğru
  });
});

describe('davranış katmanı entegrasyon (savunma bloğu)', () => {
  const sc = compileScenario(
    scenario({
      id: 's-test',
      title: 'blok testi',
      group: 'savunma',
      formation: F341,
      behaviors: defenseBlock(),
      ballStart: 'r5',
      phases: [
        phase('rakip sağa', 'not', [
          par(
            seq(run('r11', v(0.85, 0.55), { speed: 'jog' }), hold('r11', 1400)),
            seq(hold('r5', 300), pass('r5', 'r11')),
          ),
        ]),
      ],
    }),
  );

  it('hiçbir oyuncu iki kare arasında sabit değil', () => {
    const t1 = resolveFrame(sc, 500);
    const t2 = resolveFrame(sc, 800);
    for (const id of Object.keys(t1.entities)) {
      const a = t1.entities[id];
      const b = t2.entities[id];
      expect(a.x !== b.x || a.y !== b.y).toBe(true);
    }
  });

  it('blok topu takip eder (top sağa gidince savunma sağa kayar)', () => {
    // Topu taşıyan yok → carried initialCarrier (r11). r11 sağa koşarken blok kayar.
    const early = resolveFrame(sc, 200);
    const late = resolveFrame(sc, 1800);
    // Sol stoperimiz u4 topla beraber hafifçe sağa kaymalı
    expect(late.entities.u4.x).toBeGreaterThan(early.entities.u4.x);
  });

  it('5 numara her karede r9 gölgeler', () => {
    for (const t of [300, 900, 1500]) {
      const f = resolveFrame(sc, t);
      const d = Math.hypot(f.entities.u5.x - f.entities.r9.x, f.entities.u5.y - f.entities.r9.y);
      expect(d).toBeLessThan(0.15); // 9'a yakın konumlanır
    }
  });
});
