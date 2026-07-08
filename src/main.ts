import './styles.css';
import { DESIGN } from './data/constants';
import { F323 } from './data/formations';
import { ALL_PLAYERS } from './data/roster';
import { createEntities, placePlayer } from './render/entities';
import { drawPitch } from './render/pitch';
import { el, group } from './render/svg';

// ============================================================================
// Faz 0 bootstrap — statik saha + F323 diziliminde 17 oyuncu.
// (Sonraki fazlarda motor, UI ve senaryolar buraya bağlanacak.)
// ============================================================================

const app = document.getElementById('app')!;

// --- Üst bar ---
const topbar = document.createElement('div');
topbar.className = 'topbar';
topbar.innerHTML = `
  <div class="brand">
    <h1>Taktik Tahtası</h1>
    <span class="sub">3-2-3</span>
  </div>
`;
app.appendChild(topbar);

// --- Saha ---
const pitchWrap = document.createElement('div');
pitchWrap.className = 'pitch-wrap';
app.appendChild(pitchWrap);

const svg = el('svg', {
  viewBox: `0 0 ${DESIGN.width} ${DESIGN.height}`,
  preserveAspectRatio: 'xMidYMid meet',
}) as SVGSVGElement;
pitchWrap.appendChild(svg);

// Katman sırası (alttan üste): saha → bölge → oklar → oyuncular → top → halka
drawPitch(svg);
group('zones-layer', svg);
group('arrows-layer', svg);
const playersLayer = group('players-layer', svg);
const ballLayer = group('ball-layer', svg);
group('ring-layer', svg);

const entities = createEntities(playersLayer, ballLayer, ALL_PLAYERS);

// Statik yerleşim
for (const [id, node] of Object.entries(entities.players)) {
  const pos = F323.positions[id];
  if (pos) placePlayer(node, pos);
}

// Topu geçici olarak kaleci önüne koy
entities.ballCore.parentElement?.setAttribute('transform', 'translate(0 0)');
const gkPos = F323.positions.uK;
entities.ballG.setAttribute(
  'transform',
  `translate(${(DESIGN.margin + gkPos.x * (DESIGN.width - 2 * DESIGN.margin)).toFixed(1)} ${(
    DESIGN.margin +
    (gkPos.y - 0.03) * (DESIGN.height - 2 * DESIGN.margin)
  ).toFixed(1)})`,
);

console.log('Faz 0: saha + 17 oyuncu render edildi.');
