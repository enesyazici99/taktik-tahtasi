import { F323 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, hold, par, pass, phase, ring, run, scenario, seq, shoot, v,
} from '../../engine/dsl';

// H5 — Kontra: kazan, 3 pas, bitir
export default scenario({
  id: 'h5-kontra',
  title: 'Kontra: 3 pas bitir',
  group: 'hucum',
  formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'u8',
  phases: [
    phase('Top kazanıldı', 'İlk pas her zaman ileri.', [
      ring('u8'),
      seq(hold('u8', 250), pass('u8', 'u9')),
    ]),
    phase('Kanatlar sprint', 'Üç pasta bitmeyen kontra, kontra değildir.', [
      par(
        run('u7', v(0.62, 0.14), { speed: 'sprint', arrow: true }),
        run('u11', v(0.3, 0.16), { speed: 'sprint', arrow: true }),
        pass('u9', 'u7', { oneTouch: true }),
      ),
    ]),
    phase('Bitir', 'Gerisi yarı sahada durur — sigorta.', [
      shoot('u7', v(0.45, 0.03)),
    ]),
  ],
});
