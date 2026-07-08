// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { Stage } from '../stage';
import { firstScenario } from '../scenarios';
import { createScenarioList } from './scenarioList';
import { createPhasePanel } from './phasePanel';
import { createControls } from './controls';

beforeAll(() => {
  // jsdom eksiklerini doldur
  (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
  if (!window.matchMedia) {
    window.matchMedia = () =>
      ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  }
});

describe('UI bileşenleri (jsdom)', () => {
  it('senaryo listesi, faz paneli, kontroller bağlanır ve etkileşir', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    const stage = new Stage(mount);
    const sc = firstScenario();

    let selected = '';
    const list = createScenarioList((s) => (selected = s.id));
    const panel = createPhasePanel((p) => stage.clock.seek(p.t0));
    const controls = createControls(stage.clock);
    mount.append(list.el, panel.el, controls.el);

    stage.load(sc);
    panel.setScenario(sc);
    controls.setScenario(sc);

    // Grup sekmeleri ve chip'ler oluştu
    expect(mount.querySelectorAll('.group-tab').length).toBeGreaterThan(0);
    expect(mount.querySelectorAll('.chip').length).toBeGreaterThan(0);
    // Faz pill'leri
    expect(mount.querySelectorAll('.phase-pill').length).toBe(sc.phases.length);

    // İlk chip'e tıkla → seçim callback
    (mount.querySelector('.chip') as HTMLButtonElement).click();
    expect(selected).toBe(sc.id);

    // Faz pill'ine tıkla → seek (hata fırlatmamalı)
    expect(() => (mount.querySelectorAll('.phase-pill')[1] as HTMLButtonElement)?.click()).not.toThrow();

    // Oynat/durdur butonu
    const play = controls.el.querySelector('.ctrl.primary') as HTMLButtonElement;
    expect(() => play.click()).not.toThrow();
    stage.clock.pause();

    // Render bir kare
    expect(() => stage.render(sc.duration * 0.5)).not.toThrow();
  });
});
