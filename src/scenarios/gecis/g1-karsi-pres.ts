import { F323 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, hold, label, par, pass, phase, press, run, scenario, seq, v, zone,
} from '../../engine/dsl';

// G1 — Top kaybı → 5 saniye karşı-pres
export default scenario({
  id: 'g1-karsi-pres',
  title: '5 sn karşı-pres',
  group: 'gecis',
  formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'u8',
  phases: [
    phase('Top kaybı', 'İlk 5 saniye ya en iyi hücumun ya da en kötü savunma anın.', [
      seq(hold('u8', 200), pass('u8', 'r10')),
    ]),
    phase('5 saniye karşı-pres', 'En yakın 2 oyuncu anında prese, gerisi geri sprint.', [
      label(v(0.5, 0.3), '5 SANİYE'),
      par(
        press('u9', 'r10', 0.15),
        run('u7', v(0.52, 0.42), { speed: 'sprint', arrow: true }),
        run('u6', v(0.46, 0.46), { speed: 'sprint' }),
        run('u11', v(0.3, 0.5), { speed: 'sprint' }),
        hold('r10', 700),
      ),
    ]),
    phase('Geri kazan', 'Top geri kazanıldı — rakip en açık an, hemen ileri bak.', [
      zone(v(0.5, 0.42), 0.16, 0.1, 'geri kazanım'),
      seq(pass('r10', 'u6')),
    ]),
  ],
});
