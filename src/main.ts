import './styles.css';
import { Stage } from './stage';
import { firstScenario, SCENARIO_BY_ID } from './scenarios';
import { createScenarioList } from './ui/scenarioList';
import { createPhasePanel } from './ui/phasePanel';
import { createControls } from './ui/controls';
import { mountTools } from './ui/tools';
import type { CompiledScenario } from './types';

// ============================================================================
// Uygulama bağlama: senaryo seçici + saha + faz paneli + kontroller.
// Hash router, klavye kısayolları, reduced-motion.
// ============================================================================

const app = document.getElementById('app')!;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Üst bar ---
const topbar = document.createElement('div');
topbar.className = 'topbar';
const brand = document.createElement('div');
brand.className = 'brand';
brand.innerHTML = `<h1>Taktik Tahtası</h1><span class="sub">3-2-3</span><span class="spacer"></span>`;
const toolsBtn = document.createElement('button');
toolsBtn.className = 'icon-btn';
toolsBtn.title = 'Araçlar';
toolsBtn.textContent = '⋯';
brand.appendChild(toolsBtn);
topbar.appendChild(brand);

const scenarioList = createScenarioList((sc) => selectScenario(sc, true));
topbar.appendChild(scenarioList.el);
app.appendChild(topbar);

// --- Saha ---
const pitchWrap = document.createElement('div');
pitchWrap.className = 'pitch-wrap';
app.appendChild(pitchWrap);
const stage = new Stage(pitchWrap);

// --- Faz paneli ---
const phasePanel = createPhasePanel((phase) => {
  stage.clock.seek(phase.t0);
});
app.appendChild(phasePanel.el);

// --- Kontroller ---
const controls = createControls(stage.clock);
app.appendChild(controls.el);

let currentScenario: CompiledScenario = firstScenario();

// --- Bağlantılar ---
stage.onRender = (frame) => {
  phasePanel.setActive(frame.phaseIndex);
  controls.update(frame.t);
};
stage.clock.onStateChange = (s) => controls.setPlaying(s.playing);

function selectScenario(sc: CompiledScenario, updateHash: boolean): void {
  currentScenario = sc;
  stage.load(sc);
  phasePanel.setScenario(sc);
  controls.setScenario(sc);
  brand.querySelector('.sub')!.textContent = sc.title;
  if (updateHash) location.hash = `/senaryo/${sc.id}`;
  if (!reduced) stage.clock.play();
}

// --- Araçlar (v2: editör, export, varyant, ses, analiz) ---
mountTools(toolsBtn, stage, () => currentScenario, (sc) => selectScenario(sc, true));

// --- Hash router ---
function routeFromHash(): void {
  const m = location.hash.match(/senaryo\/([\w-]+)/);
  if (m && SCENARIO_BY_ID[m[1]]) {
    scenarioList.select(m[1]);
  } else {
    selectScenario(firstScenario(), true);
    scenarioList.select(firstScenario().id);
  }
}
window.addEventListener('hashchange', routeFromHash);

// --- Klavye kısayolları ---
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  switch (e.key) {
    case ' ':
      e.preventDefault();
      stage.clock.toggle();
      break;
    case 'ArrowRight':
      seekPhase(1);
      break;
    case 'ArrowLeft':
      seekPhase(-1);
      break;
    case 'r':
    case 'R':
      stage.clock.restart();
      break;
  }
});

function seekPhase(dir: number): void {
  const t = stage.clock.getTime();
  const phases = currentScenario.phases;
  let idx = 0;
  for (let i = 0; i < phases.length; i++) if (t >= phases[i].t0 - 1) idx = i;
  const next = Math.max(0, Math.min(phases.length - 1, idx + dir));
  stage.clock.seek(phases[next].t0);
}

// Başlat
routeFromHash();

if (reduced) {
  stage.clock.seek(0);
}
