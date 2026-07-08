import { F323 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, hold, par, pass, phase, ring, run, scenario, seq, shoot, v,
} from '../../engine/dsl';

// H2 — Geç binen 8 [MVP]
export default scenario({
  id: 'h2-gec-binen-8',
  title: 'Geç binen 8',
  group: 'hucum',
  formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'u11',
  phases: [
    phase('Sol taraftan atak', '11 içe kat eder, savunmayı kendine çeker.', [
      seq(hold('u11', 300), run('u11', v(0.36, 0.32), { speed: 'jog', arrow: true }), pass('u11', 'u9')),
    ]),
    phase('Savunma daralır', '9 ve 11’e yığılıyorlar — yay boşalıyor.', [
      par(
        run('r6', v(0.42, 0.28), { speed: 'jog' }),
        run('r5', v(0.5, 0.26), { speed: 'jog' }),
        pass('u9', 'u11'),
      ),
    ]),
    phase('Geç binen 8', 'Geç binen adamı kimse tutamaz. 8 gelişine vurur.', [
      ring('u8'),
      par(
        run('u8', v(0.52, 0.22), { speed: 'sprint', arrow: true }),
        seq(pass('u11', 'u8', { oneTouch: true }), shoot('u8', v(0.55, 0.03))),
      ),
    ]),
  ],
});
