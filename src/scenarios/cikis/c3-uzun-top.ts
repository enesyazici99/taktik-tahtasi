import { FBUILD } from '../../data/formations';
import {
  DEFAULT_BEHAVIORS,
  dribble,
  hold,
  label,
  longPass,
  par,
  pass,
  phase,
  press,
  run,
  scenario,
  seq,
  v,
  zone,
} from '../../engine/dsl';

// C3 — Planlı uzun top + ikinci top. Pres çok yoğun, kısa çıkış kapalı.
export default scenario({
  id: 'c3-uzun-top',
  title: 'Planlı uzun top',
  group: 'cikis',
  formation: FBUILD,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'uK',
  phases: [
    phase(
      'Pres çok yoğun',
      'Rakip herkesi birebir tuttu, kısa çıkış yok. Uzun top çaresizlik değil — plan bu.',
      [
        label(v(0.5, 0.72), 'kısa çıkış kapalı'),
        par(press('r9', 'uK', 0.14), press('r7', 'u4', 0.12), press('r11', 'u3', 0.12), hold('uK', 800)),
      ],
    ),
    phase(
      'Ölçülü uzun top 9’a',
      'Kaleci beklemeden 9’un göğsüne ölçülü uzun top. Hedef topun kendisi değil, düştüğü bölge.',
      [
        zone(v(0.5, 0.34), 0.22, 0.12, 'ikinci top bölgesi'),
        par(
          seq(hold('uK', 300), longPass('uK', 'u9')),
          run('u8', v(0.5, 0.36), { speed: 'sprint', arrow: true }),
          run('u7', v(0.62, 0.4), { speed: 'jog' }),
          run('u11', v(0.4, 0.4), { speed: 'jog' }),
        ),
      ],
    ),
    phase(
      '9 indirir, 8 alır',
      '9 topu tutmasa da fark etmez: ikinci top bölgesindeki 4 adamdan biri kapar. 8 gelişine alır.',
      [
        pass('u9', 'u8'),
      ],
    ),
    phase(
      'Alanı sıkıştır, ilerle',
      '6 ve stoperler hemen öne çıkıp alanı sıkıştırır; ikinci top da bizde kalır, sürerek çık.',
      [
        par(
          run('u6', v(0.5, 0.48), { speed: 'jog' }),
          run('u5', v(0.5, 0.6), { speed: 'jog' }),
          dribble('u8', [v(0.52, 0.3)]),
        ),
      ],
    ),
  ],
});
