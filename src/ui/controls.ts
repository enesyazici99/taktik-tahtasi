import type { Clock, Speed } from '../engine/clock';
import type { CompiledScenario } from '../types';

// ============================================================================
// Adım-merkezli kontroller: Geri / Oynat-Tekrar / Sonraki adım (büyük);
// altında ince ilerleme çubuğu + hız + "Baştan tümünü izle".
// ============================================================================

const SPEEDS: Speed[] = [0.5, 0.75, 1];

export interface ControlHandlers {
  onPlayPause: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onWatchAll: () => void;
}

export interface Controls {
  el: HTMLElement;
  setScenario(sc: CompiledScenario): void;
  update(t: number): void;
  setPlaying(playing: boolean): void;
  setStep(index: number, total: number): void;
}

export function createControls(clock: Clock, h: ControlHandlers): Controls {
  const el = document.createElement('div');
  el.className = 'controls';

  // Büyük adım navigasyonu
  const nav = document.createElement('div');
  nav.className = 'step-nav';
  const prevBtn = mkBtn('◀', 'stepbtn', 'Önceki adım');
  const playBtn = mkBtn('▶', 'stepbtn play', 'Oynat / Duraklat');
  const nextBtn = mkBtn('Sonraki adım ▶', 'stepbtn next', 'Sonraki adım');
  nav.append(prevBtn, playBtn, nextBtn);

  // İnce ilerleme çubuğu
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

  // Alt satır: tümünü izle + hız
  const bottom = document.createElement('div');
  bottom.className = 'control-row';
  const watchAllBtn = mkBtn('⟲ Baştan izle', 'ctrl wide', 'Tümünü kesintisiz izle');
  const speedGroup = document.createElement('div');
  speedGroup.className = 'speed-group';
  const speedBtns = SPEEDS.map((s) => {
    const b = document.createElement('button');
    b.className = 'speed-btn' + (s === clock.getState().speed ? ' active' : '');
    b.textContent = (s === 1 ? '1' : String(s)) + '×';
    b.onclick = () => {
      clock.setSpeed(s);
      for (const x of speedBtns) x.classList.remove('active');
      b.classList.add('active');
    };
    speedGroup.appendChild(b);
    return b;
  });
  bottom.append(watchAllBtn, speedGroup);

  el.append(nav, scrubWrap, bottom);

  // Olaylar
  playBtn.onclick = h.onPlayPause;
  prevBtn.onclick = h.onPrevStep;
  nextBtn.onclick = h.onNextStep;
  watchAllBtn.onclick = h.onWatchAll;

  let scrubbing = false;
  scrub.addEventListener('pointerdown', () => {
    scrubbing = true;
    clock.pause();
  });
  scrub.addEventListener('input', () => clock.seek(Number(scrub.value)));
  const endScrub = () => (scrubbing = false);
  scrub.addEventListener('pointerup', endScrub);
  scrub.addEventListener('pointercancel', endScrub);

  function setScenario(sc: CompiledScenario): void {
    scrub.max = String(Math.round(sc.duration));
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
  }

  function setPlaying(playing: boolean): void {
    playBtn.innerHTML = playing ? '⏸' : '▶';
  }

  function setStep(index: number, total: number): void {
    const last = index >= total - 1;
    nextBtn.innerHTML = last ? '↺ Baştan' : 'Sonraki adım ▶';
    prevBtn.disabled = index <= 0;
    prevBtn.style.opacity = index <= 0 ? '0.4' : '1';
  }

  return { el, setScenario, update, setPlaying, setStep };
}

function mkBtn(html: string, cls: string, title: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = cls;
  b.innerHTML = html;
  b.title = title;
  return b;
}
