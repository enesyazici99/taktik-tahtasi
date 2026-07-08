import { Clock } from './engine/clock';
import { resolveFrame } from './engine/resolve';
import { DESIGN } from './data/constants';
import { ALL_PLAYERS } from './data/roster';
import { AnnotationRenderer } from './render/annotations';
import { createEntities, placePlayer, type EntityLayer } from './render/entities';
import { drawPitch, toPx } from './render/pitch';
import { el, group } from './render/svg';
import type { CompiledScenario, FrameState } from './types';

// ============================================================================
// Stage: SVG + katmanlar + entity havuzu + anotasyon render + clock. render(t)
// merkezi burada. UI bu sınıfı kullanır.
// ============================================================================

export class Stage {
  readonly svg: SVGSVGElement;
  readonly clock = new Clock();
  private entities: EntityLayer;
  private annotations: AnnotationRenderer;
  private current: CompiledScenario | null = null;

  /** Her render sonrası UI için tetiklenir. */
  onRender: (frame: FrameState, sc: CompiledScenario) => void = () => {};

  constructor(mount: HTMLElement) {
    this.svg = el('svg', {
      viewBox: `0 0 ${DESIGN.width} ${DESIGN.height}`,
      preserveAspectRatio: 'xMidYMid meet',
    }) as SVGSVGElement;
    mount.appendChild(this.svg);

    drawPitch(this.svg);
    const zonesLayer = group('zones-layer', this.svg);
    const arrowsLayer = group('arrows-layer', this.svg);
    const playersLayer = group('players-layer', this.svg);
    const ballLayer = group('ball-layer', this.svg);
    const ringLayer = group('ring-layer', this.svg);

    this.entities = createEntities(playersLayer, ballLayer, ALL_PLAYERS);
    this.annotations = new AnnotationRenderer(zonesLayer, arrowsLayer, ringLayer);

    this.clock.onFrame = (t) => this.render(t);
  }

  load(sc: CompiledScenario): void {
    this.current = sc;
    this.clock.setDuration(sc.duration);
    this.clock.setPhaseEnds(sc.phases.map((p) => p.t1));
    // Sahnede olmayan oyuncuları gizle (senaryo alt kümesi kullanabilir)
    const present = new Set(Object.keys(sc.formation.positions));
    for (const [id, node] of Object.entries(this.entities.players)) {
      node.g.style.display = present.has(id) ? '' : 'none';
    }
    this.clock.seek(0);
  }

  render(t: number): void {
    const sc = this.current;
    if (!sc) return;
    const frame = resolveFrame(sc, t);

    // Oyuncular
    for (const [id, e] of Object.entries(frame.entities)) {
      const node = this.entities.players[id];
      if (node) placePlayer(node, e, e.facing);
    }

    // Top
    this.applyBall(frame);

    // Anotasyonlar
    this.annotations.update(frame.activeAnnotations);

    this.onRender(frame, sc);
  }

  private applyBall(frame: FrameState): void {
    const b = frame.ball;
    const p = toPx(b.pos);
    this.entities.ballG.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    this.entities.ballCore.setAttribute('r', (7 * b.radius).toFixed(2));

    const sh = this.entities.ballShadow;
    sh.setAttribute('cx', p.x.toFixed(1));
    sh.setAttribute('cy', (p.y + 7 + 4 * (b.radius - 1)).toFixed(1));
    sh.setAttribute('rx', (8 * b.shadow).toFixed(1));
    sh.setAttribute('ry', (4 * b.shadow).toFixed(1));

    // İz — taşınırken sönük, uçarken belirgin
    for (let i = 0; i < this.entities.trail.length; i++) {
      const tp = toPx(b.trail[i]);
      const dot = this.entities.trail[i];
      dot.setAttribute('cx', tp.x.toFixed(1));
      dot.setAttribute('cy', tp.y.toFixed(1));
      const op = (b.carried ? 0.12 : 0.4) * (1 - i / this.entities.trail.length);
      dot.setAttribute('opacity', op.toFixed(2));
    }
  }
}
