import type { Clock, Speed } from '../engine/clock';
import type { CompiledScenario } from '../types';

// ============================================================================
// Kontrol barı: scrubber (faz tick'leri) + oynat/durdur, yeniden başlat,
// geri/ileri sarma, hız (0.5/1/1.5x), adım-adım modu.
// ============================================================================

const SEEK_STEP = 2500; // ileri/geri sarma adımı (ms)
const SPEEDS: Speed[] = [0.5, 1, 1.5];

export interface Controls {
  el: HTMLElement;
  setScenario(sc: CompiledScenario): void;
  update(t: number): void;
  setPlaying(playing: boolean): void;
}

export function createControls(clock: Clock): Controls {
  const el = document.createElement('div');
  el.className = 'controls';

  // Scrubber
  const scrubWrap = document.createElement('div');
  scrubWrap.className = 'scrubber';
  const scrub = document.createElement('input');
  scrub.type = 'range';
  scrub.min = '0';
  scrub.step = '1';
  scrub.value = '0';
  const ticks = document.createElement('div');
  ticks.className = 'ticks';
  scrubWrap.append(scrub, ticks);

  // Kontrol satırı
  const row = document.createElement('div');
  row.className = 'control-row';

  const btn = (html: string, cls = 'ctrl', title = '') => {
    const b = document.createElement('button');
    b.className = cls;
    b.innerHTML = html;
    if (title) b.title = title;
    return b;
  };

  const rewindBtn = btn('⏪', 'ctrl', 'Geri sar');
  const playBtn = btn('▶', 'ctrl primary', 'Oynat / Durdur');
  const forwardBtn = btn('⏩', 'ctrl', 'İleri sar');
  const restartBtn = btn('⟲', 'ctrl', 'Yeniden başlat');
  const time = document.createElement('span');
  time.className = 'time-read';
  time.textContent = '0.0s';

  const speedGroup = document.createElement('div');
  speedGroup.className = 'speed-group';
  const speedBtns = SPEEDS.map((s) => {
    const b = document.createElement('button');
    b.className = 'speed-btn' + (s === 1 ? ' active' : '');
    b.textContent = s + '×';
    b.onclick = () => {
      clock.setSpeed(s);
      for (const x of speedBtns) x.classList.remove('active');
      b.classList.add('active');
    };
    speedGroup.appendChild(b);
    return b;
  });

  const stepBtn = btn('⤓', 'ctrl', 'Adım-adım mod');
  let stepOn = false;
  stepBtn.onclick = () => {
    stepOn = !stepOn;
    clock.setStepMode(stepOn);
    stepBtn.classList.toggle('primary', stepOn);
  };

  row.append(rewindBtn, playBtn, forwardBtn, restartBtn, time, speedGroup, stepBtn);
  el.append(scrubWrap, row);

  // Olaylar
  playBtn.onclick = () => clock.toggle();
  restartBtn.onclick = () => clock.restart();
  rewindBtn.onclick = () => clock.seek(clock.getTime() - SEEK_STEP);
  forwardBtn.onclick = () => clock.seek(clock.getTime() + SEEK_STEP);

  let scrubbing = false;
  const wasPlaying = { v: false };
  scrub.addEventListener('pointerdown', () => {
    scrubbing = true;
    wasPlaying.v = clock.getState().playing;
    clock.pause();
  });
  scrub.addEventListener('input', () => clock.seek(Number(scrub.value)));
  const endScrub = () => {
    if (scrubbing && wasPlaying.v) clock.play();
    scrubbing = false;
  };
  scrub.addEventListener('pointerup', endScrub);
  scrub.addEventListener('pointercancel', endScrub);

  function setScenario(sc: CompiledScenario): void {
    scrub.max = String(Math.round(sc.duration));
    // Faz tick'leri
    ticks.innerHTML = '';
    for (const p of sc.phases) {
      if (p.t0 <= 0) continue;
      const tick = document.createElement('div');
      tick.className = 'tick';
      tick.style.left = `${(p.t0 / sc.duration) * 100}%`;
      ticks.appendChild(tick);
    }
  }

  function update(t: number): void {
    if (!scrubbing) scrub.value = String(Math.round(t));
    time.textContent = (t / 1000).toFixed(1) + 's';
  }

  function setPlaying(playing: boolean): void {
    playBtn.innerHTML = playing ? '⏸' : '▶';
  }

  return { el, setScenario, update, setPlaying };
}
