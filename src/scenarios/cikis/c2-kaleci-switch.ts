import { F323 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, dribble, hold, label, par, pass, phase, run, scenario, seq, v,
} from '../../engine/dsl';

// C2 — Kaleciyle taraf değiştirme
export default scenario({
  id: 'c2-kaleci-switch',
  title: 'Kaleciyle switch',
  group: 'cikis',
  formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'u3',
  phases: [
    phase('Sağ kilitli, geri K', 'Bir taraf kapandıysa topu K üstünden diğer yakaya taşı.', [
      par(
        run('r7', v(0.68, 0.5), { speed: 'sprint', arrow: true }),
        seq(hold('u3', 400), pass('u3', 'uK')),
      ),
    ]),
    phase('K diğer yakaya açar', 'Kaleci +1’imiz. Rakip presi topla beraber koşamaz.', [
      seq(pass('uK', 'u4', { oneTouch: true })),
    ]),
    phase('Boş koridordan taşı', 'Rakibi koştur — açık yakadan yukarı taşı.', [
      label(v(0.22, 0.5), 'boş koridor'),
      seq(pass('u4', 'u11'), dribble('u11', [v(0.2, 0.26)])),
    ]),
  ],
});
