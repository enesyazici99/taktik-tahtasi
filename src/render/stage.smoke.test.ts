// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Stage } from '../stage';
import { firstScenario } from '../scenarios';

// Headless render duman testi — tam DOM yolunu (Stage + render) çalıştırır.
describe('Stage render (jsdom)', () => {
  it('C1 yüklenir ve kareler hatasız render edilir', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    const stage = new Stage(mount);
    const sc = firstScenario();
    stage.load(sc);

    const times = [0, sc.duration * 0.25, sc.duration * 0.5, sc.duration * 0.9, sc.duration];
    for (const t of times) {
      expect(() => stage.render(t)).not.toThrow();
    }

    // SVG oluştu, oyuncu ve top node'ları var
    expect(mount.querySelector('svg')).toBeTruthy();
    expect(mount.querySelectorAll('.player').length).toBeGreaterThan(10);
    const ball = mount.querySelector('.ball') as SVGGElement;
    expect(ball.getAttribute('transform')).toContain('translate');
  });
});
