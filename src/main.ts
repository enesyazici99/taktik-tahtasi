import './styles.css';
import { Stage } from './stage';
import { firstScenario, SCENARIO_BY_ID } from './scenarios';
import { createScenarioList } from './ui/scenarioList';
import { createPhasePanel } from './ui/phasePanel';
import { createControls } from './ui/controls';
import { mountTools } from './ui/tools';
import type { CompiledScenario } from './types';

// ============================================================================
// Uygulama bağlama — adım-merkezli izleme deneyimi.
// Her adım yavaşça oynar, sonunda durur; "Sonraki adım" ile ilerlenir;
// "Baştan tümünü izle" ile kesintisiz oynatılır.
// ============================================================================

const app = document.getElementById('app')!;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Üst bar ---
const topbar = document.createElement('div');
topbar.className = 'topbar';
const brand = document.createElement('div');
brand.className = 'brand';
brand.innerHTML = `<h1>Taktik Tahtası</h1><span class="sub">3-2-3</span>`;
const actions = document.createElement('div');
actions.className = 'brand-actions';
const helpBtn = document.createElement('button');
helpBtn.className = 'icon-btn';
helpBtn.title = 'Nasıl kullanılır?';
helpBtn.textContent = '?';
const videoBtn = document.createElement('button');
videoBtn.className = 'icon-btn';
videoBtn.title = 'Videoyu indir';
videoBtn.textContent = '⬇';
actions.append(helpBtn, videoBtn);
brand.appendChild(actions);
topbar.appendChild(brand);

const scenarioList = createScenarioList((sc) => selectScenario(sc, true));
topbar.appendChild(scenarioList.el);
app.appendChild(topbar);

// --- Saha + adım rozeti ---
const pitchWrap = document.createElement('div');
pitchWrap.className = 'pitch-wrap';
const badge = document.createElement('div');
badge.className = 'step-badge';
pitchWrap.appendChild(badge);
app.appendChild(pitchWrap);
const stage = new Stage(pitchWrap);

// --- Faz notu paneli ---
const phasePanel = createPhasePanel((phase) => goToStep(phaseIndexOf(phase.t0)));
app.appendChild(phasePanel.el);

// --- Kontroller (adım-merkezli) ---
const controls = createControls(stage.clock, {
  onPlayPause: playPause,
  onPrevStep: () => goToStep(currentIndex() - 1),
  onNextStep: () => {
    const i = currentIndex();
    goToStep(i >= currentScenario.phases.length - 1 ? 0 : i + 1);
  },
  onWatchAll: watchAll,
});
app.appendChild(controls.el);

let currentScenario: CompiledScenario = firstScenario();
let loadedId = '';

// --- Araçlar: yardım + video ---
mountTools({ helpBtn, videoBtn, stage, getCurrent: () => currentScenario });

// --- Render bağlantısı ---
stage.onRender = (frame, sc) => {
  phasePanel.setActive(frame.phaseIndex);
  controls.update(frame.t);
  controls.setStep(frame.phaseIndex, sc.phases.length);
  const ph = sc.phases[frame.phaseIndex];
  badge.textContent = ph ? `${frame.phaseIndex + 1}/${sc.phases.length} · ${ph.title}` : '';
};
stage.clock.onStateChange = (s) => controls.setPlaying(s.playing);

function selectScenario(sc: CompiledScenario, updateHash: boolean): void {
  currentScenario = sc;
  loadedId = sc.id;
  stage.load(sc);
  phasePanel.setScenario(sc);
  controls.setScenario(sc);
  if (updateHash) location.hash = `/senaryo/${sc.id}`;
  goToStep(0);
}

// --- Adım gezinme ---
function currentIndex(): number {
  const t = stage.clock.getTime();
  const phases = currentScenario.phases;
  let idx = 0;
  for (let i = 0; i < phases.length; i++) if (t >= phases[i].t0 - 1) idx = i;
  return idx;
}

function phaseIndexOf(t0: number): number {
  return Math.max(0, currentScenario.phases.findIndex((p) => Math.abs(p.t0 - t0) < 1));
}

function goToStep(index: number, autoplay = true): void {
  const phases = currentScenario.phases;
  const i = Math.max(0, Math.min(phases.length - 1, index));
  stage.clock.setStepMode(true);
  stage.clock.seek(phases[i].t0);
  if (autoplay && !reduced) stage.clock.play();
}

function playPause(): void {
  if (stage.clock.getState().playing) {
    stage.clock.pause();
    return;
  }
  const ph = currentScenario.phases[currentIndex()];
  // Adım sonundaysak o adımı baştan tekrar oynat
  if (ph && stage.clock.getTime() >= ph.t1 - 30) stage.clock.seek(ph.t0);
  stage.clock.setStepMode(true);
  stage.clock.play();
}

function watchAll(): void {
  stage.clock.setStepMode(false);
  stage.clock.seek(0);
  if (!reduced) stage.clock.play();
}

// --- Hash router (#/senaryo/id  ·  #/senaryo/id&t=2000 an paylaşımı) ---
function routeFromHash(): void {
  const m = location.hash.match(/senaryo\/([\w-]+)/);
  const tMatch = location.hash.match(/[&?]t=(\d+)/);
  const id = m && SCENARIO_BY_ID[m[1]] ? m[1] : firstScenario().id;
  if (id !== loadedId) scenarioList.select(id);
  if (tMatch) {
    stage.clock.pause();
    stage.clock.seek(Number(tMatch[1]));
  }
}
window.addEventListener('hashchange', routeFromHash);

// --- Klavye kısayolları ---
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  switch (e.key) {
    case ' ':
      e.preventDefault();
      playPause();
      break;
    case 'ArrowRight':
      goToStep(currentIndex() + 1);
      break;
    case 'ArrowLeft':
      goToStep(currentIndex() - 1);
      break;
    case 'r':
    case 'R':
      goToStep(0);
      break;
  }
});

routeFromHash();
