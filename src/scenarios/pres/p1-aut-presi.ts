import { FPRESS } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, hold, label, par, pass, phase, press, run, scenario, seq, v,
} from '../../engine/dsl';

// P1 — Aut/kaleci presi: yön verme + çizgi tuzağı [MVP]
export default scenario({
  id: 'p1-aut-presi',
  title: 'Aut/kaleci presi',
  group: 'pres',
  formation: FPRESS,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'rK',
  phases: [
    phase('9 yön verir', 'Pres kovalamak değil, yön vermektir. Topu çizgiye it.', [
      par(
        press('u9', 'rK', 0.2),
        seq(hold('rK', 500), pass('rK', 'r2')),
      ),
    ]),
    phase('Sprint baskı', '7 sprint baskı, 8 iç hattı keser, 11 ters tarafta daralır.', [
      par(
        run('u7', v(0.72, 0.22), { speed: 'sprint', arrow: true }),
        run('u8', v(0.52, 0.3), { speed: 'jog' }),
        run('u11', v(0.42, 0.34), { speed: 'jog' }),
        hold('r2', 800),
      ),
    ]),
    phase('Çizgi tuzağı', 'Çizgi bizim ekstra oyuncumuz — önden top çal, kontraya bağla.', [
      label(v(0.78, 0.2), 'çizgi tuzağı'),
      par(
        run('u3', v(0.72, 0.3), { speed: 'sprint', arrow: true }),
        seq(pass('r2', 'u3'), pass('u3', 'u9')),
      ),
    ]),
  ],
});
