import { TIMING } from '../data/constants';
import type { CompiledScenario, Phase } from '../types';

// ============================================================================
// Faz pill'leri (aktif dolu, tıkla=seek) + tebeşir koçluk notu kartı.
// ============================================================================

export interface PhasePanel {
  el: HTMLElement;
  setScenario(sc: CompiledScenario): void;
  setActive(index: number): void;
}

export function createPhasePanel(onSeek: (phase: Phase) => void): PhasePanel {
  const el = document.createElement('div');

  const strip = document.createElement('div');
  strip.className = 'phase-strip';

  const card = document.createElement('div');
  card.className = 'note-card';
  const title = document.createElement('div');
  title.className = 'note-title';
  const text = document.createElement('div');
  text.className = 'note-text';
  card.append(title, text);

  el.append(strip, card);

  let phases: Phase[] = [];
  let activeIndex = -1;
  const pills: HTMLButtonElement[] = [];

  function setScenario(sc: CompiledScenario): void {
    phases = sc.phases;
    strip.innerHTML = '';
    pills.length = 0;
    phases.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'phase-pill';
      b.innerHTML = `<span class="num">${i + 1}</span><span>${p.title}</span>`;
      b.onclick = () => onSeek(p);
      pills.push(b);
      strip.appendChild(b);
    });
    activeIndex = -1;
    setActive(0);
  }

  function setActive(index: number): void {
    if (index === activeIndex) return;
    activeIndex = index;
    pills.forEach((b, i) => b.classList.toggle('active', i === index));
    pills[index]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });

    // Not kartı: hızlı fade + 2px kayma
    const ph = phases[index];
    if (!ph) return;
    card.classList.add('fading');
    window.setTimeout(() => {
      title.textContent = ph.title;
      text.textContent = ph.note;
      card.classList.remove('fading');
    }, TIMING.noteFade);
  }

  return { el, setScenario, setActive };
}
