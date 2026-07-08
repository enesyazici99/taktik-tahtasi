import { F323 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, dribble, hold, par, pass, phase, ring, run, scenario, seq, v, zone,
} from '../../engine/dsl';

// H4 — Hedef adam üstünden taşıma + taraf değiştirme
export default scenario({
  id: 'h4-taraf-degistirme',
  title: 'Taraf değiştirme',
  group: 'hucum',
  formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'u6',
  phases: [
    phase('Dikine 9’a', '6’dan 9’un ayağına dikine top.', [
      seq(hold('u6', 400), pass('u6', 'u9')),
    ]),
    phase('9 bırakır', 'Yüzü dönük 9, gelen 8’e bırakır.', [
      par(
        run('r5', v(0.5, 0.34), { speed: 'jog' }),
        run('r6', v(0.4, 0.3), { speed: 'jog' }),
        pass('u9', 'u8'),
      ),
    ]),
    phase('Zayıf tarafa switch', 'Rakip topa yığıldıysa en tehlikeli adam ters kanattaki yalnız adamdır.', [
      ring('u11'),
      zone(v(0.2, 0.28), 0.14, 0.12, 'yalnız kanat'),
      par(
        run('u11', v(0.18, 0.22), { speed: 'sprint', arrow: true }),
        seq(pass('u8', 'u11', { oneTouch: true }), dribble('u11', [v(0.22, 0.13)])),
      ),
    ]),
  ],
});
