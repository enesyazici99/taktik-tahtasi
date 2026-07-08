import { F323 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS,
  dribble,
  hold,
  par,
  pass,
  phase,
  run,
  runArrow,
  scenario,
  seq,
  v,
} from '../../engine/dsl';

// C1 — Üçüncü adam (presten çıkış). Referans senaryo (Faz 2).
export default scenario({
  id: 'c1-ucuncu-adam',
  title: 'Üçüncü adam',
  group: 'cikis',
  formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'uK',
  phases: [
    phase('Kaleci açar', 'Prese giren adama pas yok; boş stoperi bul.', [
      par(
        seq(hold('uK', 700), pass('uK', 'u3')),
        run('r10', v(0.62, 0.5), { speed: 'sprint', arrow: true }), // rakip pres koşusu
      ),
    ]),
    phase('Üçüncü adam', '6 baskı yerse top durmaz — tek pasla 8’e döner.', [
      par(
        run('u8', v(0.66, 0.5), { speed: 'jog', arrive: 'beforeBall', arrow: true }),
        seq(pass('u3', 'u6'), pass('u6', 'u8', { oneTouch: true })),
        run('r6', v(0.5, 0.52), { speed: 'sprint' }), // rakip 6 baskıya gelir
      ),
    ]),
    phase('Oyun döner', 'Presi kırdın; acele etme, tempo senin.', [
      dribble('u8', [v(0.6, 0.42), v(0.54, 0.36)]),
      pass('u8', 'u9'),
      hold('u9', 800),
      runArrow('u8'),
    ]),
  ],
});
