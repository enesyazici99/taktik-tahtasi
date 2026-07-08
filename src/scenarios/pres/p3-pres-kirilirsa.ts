import { FPRESS } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, dribble, hold, label, par, pass, phase, press, run, scenario, seq, v,
} from '../../engine/dsl';

// P3 — Pres kırılırsa toparlanma
export default scenario({
  id: 'p3-pres-kirilirsa',
  title: 'Pres kırılırsa',
  group: 'pres',
  formation: FPRESS,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'rK',
  phases: [
    phase('Baskı ama kırılır', 'Rakip 6’sı presi kırar — panik yok.', [
      par(
        press('u9', 'rK', 0.18),
        seq(hold('rK', 400), pass('rK', 'r6'), pass('r6', 'r10')),
      ),
    ]),
    phase('Recovery sprint', 'Önce koş, sonra düşün. 6 faul yapmadan geciktirir.', [
      label(v(0.5, 0.45), 'geri koş'),
      par(
        run('u6', v(0.5, 0.5), { speed: 'sprint', arrow: true }),
        run('u8', v(0.6, 0.56), { speed: 'sprint', arrow: true }),
        run('u7', v(0.78, 0.56), { speed: 'sprint' }),
        run('u11', v(0.24, 0.56), { speed: 'sprint' }),
        seq(hold('r10', 700), dribble('r10', [v(0.5, 0.5)])),
      ),
    ]),
    phase('Blok 3-4-1 oturur', 'Geciktir, kokla, otur. Tehlike biter.', [
      par(
        run('u6', v(0.5, 0.64), { speed: 'jog' }),
        pass('r10', 'r7'),
      ),
    ]),
  ],
});
