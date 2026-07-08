import './styles.css';
import { Stage } from './stage';
import { firstScenario } from './scenarios';

// ============================================================================
// Faz 2 dev harness — derlenmiş C1 senaryosu + scrubber. (Faz 4'te tam UI.)
// ============================================================================

const app = document.getElementById('app')!;
const topbar = document.createElement('div');
topbar.className = 'topbar';
const sc = firstScenario();
topbar.innerHTML = `<div class="brand"><h1>Taktik Tahtası</h1><span class="sub">${sc.title}</span></div>`;
app.appendChild(topbar);

const pitchWrap = document.createElement('div');
pitchWrap.className = 'pitch-wrap';
app.appendChild(pitchWrap);

const stage = new Stage(pitchWrap);
stage.load(sc);

const dev = document.createElement('div');
dev.className = 'dev-bar';
dev.innerHTML = `
  <div class="control-row">
    <button class="ctrl primary" id="play">▶</button>
    <button class="ctrl" id="restart">⟲</button>
    <input type="range" id="scrub" min="0" max="${Math.round(sc.duration)}" value="0" style="flex:1" />
    <span class="time-read" id="tread">0.00s</span>
  </div>
`;
app.appendChild(dev);

const playBtn = dev.querySelector<HTMLButtonElement>('#play')!;
const scrub = dev.querySelector<HTMLInputElement>('#scrub')!;
const tread = dev.querySelector<HTMLSpanElement>('#tread')!;

playBtn.onclick = () => stage.clock.toggle();
dev.querySelector<HTMLButtonElement>('#restart')!.onclick = () => stage.clock.restart();
scrub.oninput = () => {
  stage.clock.pause();
  stage.clock.seek(Number(scrub.value));
};

stage.clock.onStateChange = (s) => {
  playBtn.textContent = s.playing ? '⏸' : '▶';
};
stage.onRender = (frame, s) => {
  scrub.value = String(Math.round(frame.t));
  const ph = s.phases[frame.phaseIndex];
  tread.textContent = `${(frame.t / 1000).toFixed(1)}s · ${ph?.title ?? ''}`;
};

console.log('Faz 2: C1 derlendi ve yüklendi.');
