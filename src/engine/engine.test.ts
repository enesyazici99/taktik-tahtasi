import { describe, expect, it } from 'vitest';
import type { CompiledScenario, EntityTrack } from '../types';
import { EASINGS, sampleTrack } from './interpolate';
import { resolveFrame } from './resolve';

const track: EntityTrack = {
  id: 'u8',
  keyframes: [
    { t: 0, pos: { x: 0.2, y: 0.6 } },
    { t: 1000, pos: { x: 0.8, y: 0.6 }, ease: 'smooth' },
    { t: 2000, pos: { x: 0.2, y: 0.6 }, ease: 'smooth' },
  ],
};

describe('easing', () => {
  it('uç noktalarda 0 ve 1', () => {
    for (const e of Object.values(EASINGS)) {
      expect(e(0)).toBeCloseTo(0);
      expect(e(1)).toBeCloseTo(1);
    }
  });
});

describe('sampleTrack determinizm', () => {
  it('A→B→A gidip döner', () => {
    expect(sampleTrack(track, 0).x).toBeCloseTo(0.2);
    expect(sampleTrack(track, 1000).x).toBeCloseTo(0.8);
    expect(sampleTrack(track, 2000).x).toBeCloseTo(0.2);
  });

  it('ileri-geri sarınca aynı kare (saf)', () => {
    const forward = [0, 250, 500, 750, 1000].map((t) => sampleTrack(track, t).x);
    const backward = [1000, 750, 500, 250, 0].map((t) => sampleTrack(track, t).x).reverse();
    expect(forward).toEqual(backward);
  });

  it('aralık dışı klemplenir', () => {
    expect(sampleTrack(track, -500).x).toBeCloseTo(0.2);
    expect(sampleTrack(track, 5000).x).toBeCloseTo(0.2);
  });
});

const scenario: CompiledScenario = {
  id: 'test',
  title: 'Test',
  group: 'hucum',
  duration: 2000,
  formation: {
    id: 'F',
    name: 'F',
    positions: { u8: { x: 0.2, y: 0.6 }, r9: { x: 0.5, y: 0.7 }, u5: { x: 0.5, y: 0.8 } },
  },
  players: [],
  tracks: [track],
  behaviors: { u5: [{ kind: 'shadowMark', targetId: 'r9', offset: { x: 0, y: 0.05 } }] },
  ball: [{ kind: 'carried', t0: 0, t1: 2000, carrierId: 'u8' }],
  annotations: [],
  phases: [{ id: 'p1', title: 'P1', note: 'n', t0: 0, t1: 2000 }],
};

describe('resolveFrame saflığı', () => {
  it('aynı t → aynı FrameState', () => {
    const a = JSON.stringify(resolveFrame(scenario, 640));
    const b = JSON.stringify(resolveFrame(scenario, 640));
    expect(a).toBe(b);
  });

  it('top taşıyıcıyı takip eder', () => {
    const f = resolveFrame(scenario, 1000);
    // Taşınan top, u8 ile hemen hemen aynı x'te
    expect(Math.abs(f.ball.pos.x - f.entities.u8.x)).toBeLessThan(0.02);
    expect(f.ball.carried).toBe(true);
  });

  it('idleSway iki kare arasında hareket üretir (kimse sabit değil)', () => {
    const p1 = resolveFrame(scenario, 400).entities.r9;
    const p2 = resolveFrame(scenario, 700).entities.r9;
    expect(p1.x !== p2.x || p1.y !== p2.y).toBe(true);
  });
});
