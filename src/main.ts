import './styles.css';
import { Stage } from './stage';
import type { CompiledScenario } from './types';

// ============================================================================
// Faz 1 dev harness — motor çekirdeğini görsel doğrula. Test track A→B→A,
// scrubber + oynat/durdur. (Faz 2/4'te gerçek DSL + UI ile değişecek.)
// ============================================================================

const app = document.getElementById('app')!;
const topbar = document.createElement('div');
topbar.className = 'topbar';
topbar.innerHTML = `<div class="brand"><h1>Taktik Tahtası</h1><span class="sub">motor testi</span></div>`;
app.appendChild(topbar);

const pitchWrap = document.createElement('div');
pitchWrap.className = 'pitch-wrap';
app.appendChild(pitchWrap);

const stage = new Stage(pitchWrap);

const test: CompiledScenario = {
  id: 'test',
  title: 'Motor Testi',
  group: 'hucum',
  duration: 3000,
  formation: {
    id: 'F',
    name: 'F',
    positions: {
      u8: { x: 0.2, y: 0.6 },
      u9: { x: 0.5, y: 0.3 },
      r9: { x: 0.5, y: 0.7 },
      u5: { x: 0.5, y: 0.82 },
      uK: { x: 0.5, y: 0.95 },
    },
  },
  players: [],
  tracks: [
    {
      id: 'u8',
      keyframes: [
        { t: 0, pos: { x: 0.2, y: 0.6 } },
        { t: 1500, pos: { x: 0.8, y: 0.4 }, ease: 'smooth' },
        { t: 3000, pos: { x: 0.2, y: 0.6 }, ease: 'smooth' },
      ],
    },
  ],
  behaviors: {
    u5: [{ kind: 'shadowMark', targetId: 'r9', offset: { x: 0, y: 0.05 } }],
    r9: [{ kind: 'idleSway', amp: 0.006 }],
  },
  ball: [{ kind: 'carried', t0: 0, t1: 3000, carrierId: 'u8' }],
  annotations: [
    { kind: 'ring', t0: 500, t1: 2500, playerId: 'u8' },
    { kind: 'zone', t0: 800, t1: 2600, center: { x: 0.7, y: 0.4 }, rx: 0.12, ry: 0.08, label: 'test bölge' },
  ],
  phases: [
    { id: 'a', title: 'Git', note: 'A→B', t0: 0, t1: 1500 },
    { id: 'b', title: 'Dön', note: 'B→A', t0: 1500, t1: 3000 },
  ],
};

stage.load(test);

// Dev kontrol barı
const dev = document.createElement('div');
dev.className = 'dev-bar';
dev.innerHTML = `
  <div class="control-row">
    <button class="ctrl primary" id="play">▶</button>
    <button class="ctrl" id="restart">⟲</button>
    <input type="range" id="scrub" min="0" max="3000" value="0" style="flex:1" />
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
stage.onRender = (frame) => {
  scrub.value = String(Math.round(frame.t));
  tread.textContent = (frame.t / 1000).toFixed(2) + 's';
};

console.log('Faz 1: motor + scrubber hazır.');
