import { F323 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, dribble, hold, longPass, par, pass, phase, run, scenario, seq, v, zone,
} from '../../engine/dsl';

// C3 — Planlı uzun top + ikinci top [MVP]
export default scenario({
  id: 'c3-uzun-top',
  title: 'Planlı uzun top',
  group: 'cikis',
  formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'uK',
  phases: [
    phase('Ölçülü uzun top', 'Uzun top çaresizlik değil, plandır.', [
      zone(v(0.5, 0.34), 0.22, 0.12, 'ikinci top bölgesi'),
      par(
        seq(hold('uK', 300), longPass('uK', 'u9')),
        run('u8', v(0.5, 0.36), { speed: 'sprint', arrow: true }),
        run('u7', v(0.62, 0.4), { speed: 'jog' }),
        run('u11', v(0.4, 0.4), { speed: 'jog' }),
      ),
    ]),
    phase('9 indirir, 8 alır', 'Plan topun kendisi değil, düştüğü yerdeki 4 adamdır.', [
      pass('u9', 'u8'),
    ]),
    phase('Alan sıkışır', '6 ve stoperler öne çıkıp alanı sıkıştırır.', [
      par(
        run('u6', v(0.5, 0.48), { speed: 'jog' }),
        dribble('u8', [v(0.52, 0.3)]),
      ),
    ]),
  ],
});
