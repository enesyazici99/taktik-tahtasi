import { F341 } from '../../data/formations';
import {
  defenseBlock, dribble, hold, label, pass, phase, scenario, seq, v,
} from '../../engine/dsl';

// S1 — 3-4-1 blok kayması [MVP]
export default scenario({
  id: 's1-blok-kaymasi',
  title: '3-4-1 blok kayması',
  group: 'savunma',
  formation: F341,
  behaviors: defenseBlock(),
  ballStart: 'r5',
  phases: [
    phase('Blok 3-4-1', 'Kimse adam kovalamaz; blok topla beraber nefes alır.', [
      label(v(0.5, 0.16), 'kanatlar iner'),
      seq(hold('r5', 300), pass('r5', 'r6'), pass('r6', 'r2')),
    ]),
    phase('Top kanada, blok kayar', 'Hatlar arası 8-10 metre — o tarafa kay.', [
      seq(pass('r2', 'r11'), dribble('r11', [v(0.82, 0.5)]), hold('r11', 500)),
    ]),
    phase('6 keser', 'İçeri pas = bizim topumuz.', [
      seq(pass('r11', 'u6')),
    ]),
  ],
});
