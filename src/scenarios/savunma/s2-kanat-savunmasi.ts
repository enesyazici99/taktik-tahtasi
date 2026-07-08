import { F341 } from '../../data/formations';
import {
  defenseBlock, dribble, hold, par, pass, phase, run, scenario, seq, v, zone,
} from '../../engine/dsl';

// S2 — Kanat savunması + ara pası kesme
export default scenario({
  id: 's2-kanat-savunmasi',
  title: 'Kanat savunması',
  group: 'savunma',
  formation: F341,
  behaviors: defenseBlock(),
  ballStart: 'r11',
  phases: [
    phase('Rakip 11 iner', 'Kanatta amaç top çalmak değil çizgiye hapsetmek.', [
      par(
        seq(dribble('r11', [v(0.82, 0.62)]), hold('r11', 500)),
        run('u7', v(0.78, 0.58), { speed: 'sprint', arrow: true }),
        run('u3', v(0.74, 0.72), { speed: 'jog' }),
      ),
    ]),
    phase('Koridor kapanır', 'İçeri dönmek zorunda — koridoru kapat.', [
      zone(v(0.72, 0.6), 0.12, 0.12, 'koridor'),
      seq(dribble('r11', [v(0.64, 0.66)])),
    ]),
    phase('Ara pasını 8 keser', 'İçeri pas = bizim topumuz. Kontraya bağla.', [
      seq(pass('r11', 'u8')),
    ]),
  ],
});
