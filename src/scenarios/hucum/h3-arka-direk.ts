import { F323 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, hold, par, pass, phase, run, scenario, seq, shoot, v, zone,
} from '../../engine/dsl';

// H3 — Arka direk ortası
export default scenario({
  id: 'h3-arka-direk',
  title: 'Arka direk ortası',
  group: 'hucum',
  formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'u7',
  phases: [
    phase('Sağdan çizgiye', '7 çizgiye iner, kafasını kaldırır.', [
      seq(hold('u7', 300), run('u7', v(0.82, 0.15), { speed: 'sprint', arrow: true })),
    ]),
    phase('Üç hedef koşusu', 'Ceza sahasında üç hedef: ön direk, arka direk, penaltı noktası.', [
      zone(v(0.5, 0.12), 0.28, 0.09, 'üç hedef'),
      par(
        hold('u7', 900),
        run('u9', v(0.4, 0.12), { speed: 'sprint', arrow: true }),
        run('u11', v(0.62, 0.14), { speed: 'sprint', arrow: true }),
        run('u8', v(0.5, 0.24), { speed: 'jog' }),
      ),
    ]),
    phase('Orta ve bitiş', 'Ortayı arka direğe as; 9 ön direği boşaltır.', [
      seq(pass('u7', 'u11'), shoot('u11', v(0.48, 0.03))),
    ]),
  ],
});
