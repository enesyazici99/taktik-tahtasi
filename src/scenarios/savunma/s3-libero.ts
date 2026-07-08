import { F341 } from '../../data/formations';
import {
  defenseBlock, hold, label, longPass, par, pass, phase, ring, run, scenario, seq, v,
} from '../../engine/dsl';

// S3 — Libero + uzun top kesme (ofsayt yok) [MVP]
export default scenario({
  id: 's3-libero',
  title: 'Libero + uzun top',
  group: 'savunma',
  formation: F341,
  behaviors: defenseBlock(),
  ballStart: 'rK',
  phases: [
    phase('Forvet arkada kamp', 'Ofsayt yok = düz çizgi yok. 5 her zaman son adam.', [
      ring('r9'),
      par(
        run('uK', v(0.5, 0.82), { speed: 'jog' }), // sweeper pozisyonu
        hold('rK', 600),
      ),
    ]),
    phase('Uzun top, 5 önden keser', 'Topu önden karşıla; kontrolü bekleyen stoper kaybeder.', [
      label(v(0.5, 0.62), 'son adam = 5'),
      seq(longPass('rK', 'u5')),
    ]),
    phase('Düşen topu 6 alır', 'Kaleci onun sigortası. Sakin çıkışa bağla.', [
      seq(pass('u5', 'u6'), hold('u6', 500)),
    ]),
  ],
});
