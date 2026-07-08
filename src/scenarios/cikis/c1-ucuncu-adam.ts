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
  ring,
  run,
  scenario,
  seq,
  v,
} from '../../engine/dsl';

// C1 — Üçüncü adam (presten çıkış). Rakip stoperlere BİREBİR basıyor.
export default scenario({
  id: 'c1-ucuncu-adam',
  title: 'Üçüncü adam',
  group: 'cikis',
  formation: FBUILD,
  behaviors: DEFAULT_BEHAVIORS,
  ballStart: 'uK',
  phases: [
    phase(
      'Rakip birebir bastı',
      'Rakip stoperlere adam adam bastı, santrafor kaleciye geliyor. Panik yok: kaleci +1’imiz, sahada sayı üstünlüğü bizde.',
      [
        label(v(0.5, 0.7), '1’e 1 pres'),
        ring('uK'),
        par(press('r9', 'uK', 0.16), hold('uK', 900)),
      ],
    ),
    phase(
      'Kaleci +1’i kullan',
      'Kaleci prese gelen adamı üstüne çeker, açığa düşen stopere verir. Baskıyı pasla kır, uzun topa kaçma.',
      [
        par(
          seq(hold('uK', 300), pass('uK', 'u3')),
          run('r11', v(0.66, 0.74), { speed: 'sprint', arrow: true }), // 3’e baskı gelir
        ),
      ],
    ),
    phase(
      'Prese giren adama pas yok',
      'Baskı gelen adama geri verme. 6 topu ister, prese giren adamın arkasına düşer.',
      [
        par(
          run('u6', v(0.52, 0.62), { speed: 'jog' }),
          run('r10', v(0.6, 0.64), { speed: 'sprint', arrow: true }),
          pass('u3', 'u6'),
        ),
      ],
    ),
    phase(
      'Üçüncü adam boşta',
      '6’ya baskı gelince top durmaz: tek dokunuşla üçüncü adama — 8 boş koridora doğru koşar.',
      [
        ring('u8'),
        par(
          run('u8', v(0.6, 0.5), { speed: 'sprint', arrive: 'beforeBall', arrow: true }),
          pass('u6', 'u8', { oneTouch: true }),
        ),
      ],
    ),
    phase(
      'Presi kır, oyunu kur',
      'Presi kırdın; artık ileride sayı sende. Acele etme — sürerek çık, tempoyu sen belirle.',
      [
        seq(dribble('u8', [v(0.56, 0.42), v(0.52, 0.36)]), pass('u8', 'u9'), hold('u9', 800)),
      ],
    ),
  ],
});
