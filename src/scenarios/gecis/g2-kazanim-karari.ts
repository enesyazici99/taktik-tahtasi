import { F341 } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS, dribble, hold, label, pass, phase, ring, scenario, seq, v,
} from '../../engine/dsl';

// G2 — Top kazanımı: kontra mı, sahiplenme mi?
export default scenario({
  id: 'g2-kazanim-karari',
  title: 'Kazanım kararı',
  group: 'gecis',
  formation: F341,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'u6',
  phases: [
    phase('6 kazanır', 'Önün açıksa ileri; değilse tempoyu sen kur.', [
      ring('u6'),
      hold('u6', 500),
    ]),
    phase('KARAR: sahiplen', 'Rakip geride toplanmış — ilk pas geriye/yana.', [
      label(v(0.4, 0.68), 'KARAR'),
      seq(pass('u6', 'u4')),
    ]),
    phase('Rakibi koştur', 'Genç takımı yenmenin yolu: onlar koşarken sen topu koştur.', [
      seq(pass('u4', 'u3'), dribble('u3', [v(0.72, 0.66), v(0.72, 0.56)])),
    ]),
  ],
});
