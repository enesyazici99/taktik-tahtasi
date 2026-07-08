import { F323 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, dribble, hold, par, pass, phase, ring, run, scenario, seq, shoot, v, zone,
} from '../../engine/dsl';

// H1 — Kanat duvarı + derinlik [MVP]
export default scenario({
  id: 'h1-kanat-duvari',
  title: 'Kanat duvarı',
  group: 'hucum',
  formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'u7',
  phases: [
    phase('7 duvarı başlatır', 'Duvar oynayan koşar. Topu bekleme, boşluğa iste.', [
      seq(hold('u7', 400), pass('u7', 'u9')),
    ]),
    phase('Derinlik koşusu', 'Ofsayt yok — stoperin arkasına koş, 9 tek dokunuşla bıraksın.', [
      ring('u7'),
      zone(v(0.6, 0.13), 0.16, 0.1, 'derinlik'),
      par(
        run('u7', v(0.62, 0.13), { speed: 'sprint', arrow: true }),
        pass('u9', 'u7', { oneTouch: true }),
        run('r2', v(0.6, 0.18), { speed: 'sprint' }),
      ),
    ]),
    phase('Bitiş', 'Kaleciyle karşı karşıya: arka direği gör, panik yok.', [
      par(
        seq(dribble('u7', [v(0.55, 0.08)]), shoot('u7', v(0.42, 0.03))),
        run('u11', v(0.66, 0.14), { speed: 'sprint', arrow: true }),
        run('u8', v(0.52, 0.26), { speed: 'sprint' }),
      ),
    ]),
  ],
});
