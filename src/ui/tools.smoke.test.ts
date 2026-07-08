// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { Stage } from '../stage';
import { firstScenario } from '../scenarios';
import { mountTools } from './tools';
import { compileFrames } from './editorCompile';

beforeAll(() => {
  (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
  if (!window.matchMedia) {
    window.matchMedia = () =>
      ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  }
});

describe('editör derleme', () => {
  it('kareler geçerli bir CompiledScenario üretir', () => {
    const sc = compileFrames({
      id: 'c', title: 'C', frameMs: 1500,
      frames: [
        { positions: { u8: { x: 0.5, y: 0.6 }, u9: { x: 0.5, y: 0.3 } }, ball: 'u8' },
        { positions: { u8: { x: 0.5, y: 0.5 }, u9: { x: 0.5, y: 0.3 } }, ball: 'u9' },
      ],
    });
    expect(sc.tracks.length).toBe(2);
    expect(sc.ball.length).toBeGreaterThan(0);
    // Taşıyıcı değişimi → uçuş segmenti var
    expect(sc.ball.some((s) => s.kind === 'flight')).toBe(true);
    expect(sc.duration).toBeGreaterThan(0);
  });
});

describe('araçlar menüsü (jsdom)', () => {
  it('mount edilir, editör ve analiz modları açılıp kapanır', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    const stage = new Stage(mount);
    const sc = firstScenario();
    stage.load(sc);

    const btn = document.createElement('button');
    document.body.appendChild(btn);
    let loaded: string | null = null;
    const tools = mountTools(btn, stage, () => sc, (s) => (loaded = s.id));

    // Narration toggle güvenli
    expect(typeof tools.narration.toggle()).toBe('boolean');

    // Editör aç
    const menu = document.querySelector('.tools-menu')!;
    (menu.querySelector('[data-a="editor"]') as HTMLButtonElement).click();
    const editorBar = document.querySelector('.editor-bar') as HTMLElement;
    expect(editorBar.style.display).not.toBe('none');
    // Kare ekle + önizle
    expect(() => (editorBar.querySelector('[data-a="add"]') as HTMLButtonElement).click()).not.toThrow();
    expect(() => (editorBar.querySelector('[data-a="play"]') as HTMLButtonElement).click()).not.toThrow();
    expect(loaded).toBeTruthy();
    (editorBar.querySelector('[data-a="exit"]') as HTMLButtonElement).click();

    // Analiz aç (zayıf bölge hesaplar, hata fırlatmamalı)
    (menu.querySelector('[data-a="analysis"]') as HTMLButtonElement).click();
    expect(() => stage.render(0)).not.toThrow();
  });
});
