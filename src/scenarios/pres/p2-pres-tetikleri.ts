import { F341 } from '../../data/formations';
import {
  defenseBlock, hold, label, longPass, par, pass, phase, run, scenario, seq, v, zone,
} from '../../engine/dsl';

// P2 — Pres tetikleri
export default scenario({
  id: 'p2-pres-tetikleri',
  title: 'Pres tetikleri',
  group: 'pres',
  formation: F341,
  behaviors: defenseBlock(),
  ballStart: 'rK',
  phases: [
    phase('Orta blok bekler', 'Tetik yoksa pres yok, blok var. Blok topla nefes alır.', [
      seq(hold('rK', 300), pass('rK', 'r5'), pass('r5', 'r6')),
    ]),
    phase('TETİK: geri pas', 'Geri pas anında 9+8 sıçrar, tüm blok 10m öne.', [
      label(v(0.3, 0.16), 'TETİK'),
      par(
        pass('r6', 'rK'),
        run('u9', v(0.5, 0.22), { speed: 'sprint', arrow: true }),
        run('u8', v(0.5, 0.4), { speed: 'sprint', arrow: true }),
      ),
    ]),
    phase('İkinci top bizim', 'Rakip aceleyle uzun atar; 5+6 ikinci topu alır.', [
      zone(v(0.5, 0.55), 0.2, 0.12, 'ikinci top'),
      seq(longPass('rK', 'u5'), pass('u5', 'u6')),
    ]),
  ],
});
