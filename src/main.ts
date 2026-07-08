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
  onPrevStep: () => goToStep(stepIndex - 1),
  onNextStep: () =>
    goToStep(stepIndex >= currentScenario.phases.length - 1 ? 0 : stepIndex + 1),
  onWatchAll: watchAll,
});
app.appendChild(controls.el);

let currentScenario: CompiledScenario = firstScenario();
let loadedId = '';
let stepIndex = 0; // gösterilen/aktif adım (gerçek durum — sınır belirsizliğini önler)

// --- Araçlar: yardım + video ---
mountTools({ helpBtn, videoBtn, stage, getCurrent: () => currentScenario });

// --- Render bağlantısı ---
stage.onRender = (frame, sc) => {
  controls.update(frame.t);
  // Saat sınırdan ÖNCE durduğu için frame.phaseIndex her zaman aktif adımı verir.
  stepIndex = frame.phaseIndex;
  syncStepUI(sc);
};
stage.clock.onStateChange = (s) => controls.setPlaying(s.playing);

function syncStepUI(sc: CompiledScenario): void {
  phasePanel.setActive(stepIndex);
  controls.setStep(stepIndex, sc.phases.length);
  const ph = sc.phases[stepIndex];
  badge.textContent = ph ? `${stepIndex + 1}/${sc.phases.length} · ${ph.title}` : '';
}

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
function phaseIndexOf(t0: number): number {
  return Math.max(0, currentScenario.phases.findIndex((p) => Math.abs(p.t0 - t0) < 1));
}

function goToStep(index: number, autoplay = true): void {
  const phases = currentScenario.phases;
  stepIndex = Math.max(0, Math.min(phases.length - 1, index));
  stage.clock.setStepMode(true);
  stage.clock.seek(phases[stepIndex].t0); // adımın BAŞINA → play ile hareket görünür
  syncStepUI(currentScenario);
  if (autoplay && !reduced) stage.clock.play();
}

function playPause(): void {
  if (stage.clock.getState().playing) {
    stage.clock.pause();
    return;
  }
  const ph = currentScenario.phases[stepIndex];
  // Adım sonundaysak (ya da dışındaysak) o adımı baştan tekrar oynat
  const t = stage.clock.getTime();
  if (ph && (t >= ph.t1 - 30 || t < ph.t0)) stage.clock.seek(ph.t0);
  stage.clock.setStepMode(true);
  stage.clock.play();
}

function watchAll(): void {
  stepIndex = 0;
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
      goToStep(stepIndex + 1);
      break;
    case 'ArrowLeft':
      goToStep(stepIndex - 1);
      break;
    case 'r':
    case 'R':
      goToStep(0);
      break;
  }
});

routeFromHash();
