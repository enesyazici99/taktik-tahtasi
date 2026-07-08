import { FBUILD } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS,
  dribble,
  hold,
  label,
  par,
  pass,
  phase,
  press,
  run,
  scenario,
  seq,
  v,
} from '../../engine/dsl';

// C2 — Kaleciyle taraf değiştirme. Rakip bir yanı birebir kapadı.
export default scenario({
  id: 'c2-kaleci-switch',
  title: 'Kaleciyle switch',
  group: 'cikis',
  formation: FBUILD,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'u3',
  phases: [
    phase(
      'Rakip sağı kapadı',
      'Rakip sağ tarafımıza yığıldı, birebir bastı. O tarafı zorlama — kalabalığa pas kaybettirir.',
      [
        label(v(0.72, 0.66), 'kalabalık taraf'),
        par(press('r11', 'u3', 0.16), press('r5', 'u7', 0.12), hold('u3', 700)),
      ],
    ),
    phase(
      'Geri kaleciye',
      'Kapalı tarafta ısrar yok. Topu kaleciye geri ver — rakip presi topla beraber diğer yakaya koşamaz.',
      [
        seq(pass('u3', 'uK')),
      ],
    ),
    phase(
      'Kaleci tek dokunuşla zayıf yakaya',
      'Kaleci +1’imiz. Bir dokunuşta boş kalan sol stopere açar; taraf değişti, rakip yeniden koşacak.',
      [
        par(
          seq(pass('uK', 'u4', { oneTouch: true })),
          run('r7', v(0.34, 0.76), { speed: 'jog' }),
        ),
      ],
    ),
    phase(
      'Boş koridordan çık',
      'Zayıf yaka açık: 4’ten 11’e, 11 önündeki boşluktan yukarı taşı. Rakibi koşturduk, tempo bizde.',
      [
        label(v(0.2, 0.5), 'boş koridor'),
        seq(pass('u4', 'u11'), dribble('u11', [v(0.2, 0.42), v(0.22, 0.34)])),
      ],
    ),
  ],
});
