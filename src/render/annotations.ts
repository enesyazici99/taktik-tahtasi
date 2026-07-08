import { COLORS } from '../data/constants';
import type { ResolvedAnnotation, Vec } from '../types';
import { scaleR, toPx } from './pitch';
import { el } from './svg';

// ============================================================================
// Anotasyon render'ı — havuzlu. Her frame node yaratılmaz; gizle/göster + attr.
// Oklar: pas = düz sarı (dashoffset ile çizilir), koşu = kesikli tebeşir,
// bölge = sarı %12 dolgu + kesikli kontur, halka = kesikli sarı.
// ============================================================================

interface Pool {
  passLines: SVGLineElement[];
  runArrows: SVGPathElement[];
  zones: SVGEllipseElement[];
  zoneLabels: SVGTextElement[];
  rings: SVGCircleElement[];
  labels: SVGTextElement[];
}

export class AnnotationRenderer {
  private pool: Pool = {
    passLines: [],
    runArrows: [],
    zones: [],
    zoneLabels: [],
    rings: [],
    labels: [],
  };

  constructor(
    private zonesLayer: SVGGElement,
    private arrowsLayer: SVGGElement,
    private ringLayer: SVGGElement,
  ) {}

  private passLine(i: number): SVGLineElement {
    if (!this.pool.passLines[i]) {
      this.pool.passLines[i] = el('line', {
        stroke: COLORS.accent,
        'stroke-width': 3,
        'stroke-linecap': 'round',
        opacity: 0,
      }, this.arrowsLayer);
    }
    return this.pool.passLines[i];
  }
  private runArrow(i: number): SVGPathElement {
    if (!this.pool.runArrows[i]) {
      this.pool.runArrows[i] = el('path', {
        fill: 'none',
        stroke: COLORS.chalk,
        'stroke-width': 2.5,
        'stroke-dasharray': '7 6',
        'stroke-linecap': 'round',
        opacity: 0,
      }, this.arrowsLayer);
    }
    return this.pool.runArrows[i];
  }
  private zone(i: number): SVGEllipseElement {
    if (!this.pool.zones[i]) {
      this.pool.zones[i] = el('ellipse', {
        fill: COLORS.accent,
        'fill-opacity': 0.12,
        stroke: COLORS.accent,
        'stroke-width': 2,
        'stroke-dasharray': '5 6',
        opacity: 0,
      }, this.zonesLayer);
    }
    return this.pool.zones[i];
  }
  private zoneLabel(i: number): SVGTextElement {
    if (!this.pool.zoneLabels[i]) {
      this.pool.zoneLabels[i] = el('text', {
        'text-anchor': 'middle',
        'font-family': "'Barlow Condensed', sans-serif",
        'font-weight': 600,
        'font-size': 16,
        fill: COLORS.accent,
        opacity: 0,
      }, this.zonesLayer);
    }
    return this.pool.zoneLabels[i];
  }
  private ring(i: number): SVGCircleElement {
    if (!this.pool.rings[i]) {
      this.pool.rings[i] = el('circle', {
        fill: 'none',
        stroke: COLORS.accent,
        'stroke-width': 2.5,
        'stroke-dasharray': '4 5',
        opacity: 0,
      }, this.ringLayer);
    }
    return this.pool.rings[i];
  }
  private label(i: number): SVGTextElement {
    if (!this.pool.labels[i]) {
      this.pool.labels[i] = el('text', {
        'text-anchor': 'middle',
        'font-family': "'Barlow Condensed', sans-serif",
        'font-weight': 600,
        'font-size': 17,
        fill: COLORS.accent,
        stroke: COLORS.bg,
        'stroke-width': 0.5,
        opacity: 0,
      }, this.arrowsLayer);
    }
    return this.pool.labels[i];
  }

  update(anns: ResolvedAnnotation[]): void {
    const idx = { passLines: 0, runArrows: 0, zones: 0, rings: 0, labels: 0 };

    for (const a of anns) {
      switch (a.kind) {
        case 'passLine': {
          const n = this.passLine(idx.passLines++);
          const p0 = toPx(a.from);
          const p1 = toPx(a.to);
          const cx = lerp(p0.x, p1.x, a.progress);
          const cy = lerp(p0.y, p1.y, a.progress);
          n.setAttribute('x1', p0.x.toFixed(1));
          n.setAttribute('y1', p0.y.toFixed(1));
          n.setAttribute('x2', cx.toFixed(1));
          n.setAttribute('y2', cy.toFixed(1));
          n.setAttribute('opacity', a.opacity.toFixed(2));
          break;
        }
        case 'runArrow': {
          const n = this.runArrow(idx.runArrows++);
          n.setAttribute('d', arrowPath(a.path, a.progress));
          n.setAttribute('opacity', (a.opacity * 0.85).toFixed(2));
          break;
        }
        case 'zone': {
          const n = this.zone(idx.zones++);
          const c = toPx(a.center);
          n.setAttribute('cx', c.x.toFixed(1));
          n.setAttribute('cy', c.y.toFixed(1));
          n.setAttribute('rx', scaleR(a.rx).toFixed(1));
          n.setAttribute('ry', scaleR(a.ry).toFixed(1));
          n.setAttribute('opacity', a.opacity.toFixed(2));
          if (a.label) {
            const t = this.zoneLabel(idx.zones - 1);
            t.setAttribute('x', c.x.toFixed(1));
            t.setAttribute('y', (c.y + 5).toFixed(1));
            t.setAttribute('opacity', a.opacity.toFixed(2));
            t.textContent = a.label;
          }
          break;
        }
        case 'ring': {
          const n = this.ring(idx.rings++);
          const c = toPx(a.pos);
          n.setAttribute('cx', c.x.toFixed(1));
          n.setAttribute('cy', c.y.toFixed(1));
          n.setAttribute('r', '24');
          n.setAttribute('opacity', a.opacity.toFixed(2));
          break;
        }
        case 'label': {
          const n = this.label(idx.labels++);
          const c = toPx(a.pos);
          n.setAttribute('x', c.x.toFixed(1));
          n.setAttribute('y', c.y.toFixed(1));
          n.setAttribute('opacity', a.opacity.toFixed(2));
          n.textContent = a.text;
          break;
        }
      }
    }

    // Kullanılmayan havuz node'larını gizle
    hideFrom(this.pool.passLines, idx.passLines);
    hideFrom(this.pool.runArrows, idx.runArrows);
    hideFrom(this.pool.zones, idx.zones);
    hideFrom(this.pool.zoneLabels, idx.zones);
    hideFrom(this.pool.rings, idx.rings);
    hideFrom(this.pool.labels, idx.labels);
  }
}

function hideFrom(arr: SVGElement[], from: number): void {
  for (let i = from; i < arr.length; i++) arr[i].setAttribute('opacity', '0');
}

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

/** Yol boyunca (progress kadar) çizilen path + ucunda ok başı. */
function arrowPath(path: Vec[], progress: number): string {
  if (path.length < 2) return '';
  const pts = path.map(toPx);
  // Toplam uzunluk ve progress'e karşılık gelen kesme noktası
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    segs.push(d);
    total += d;
  }
  const target = total * progress;
  let acc = 0;
  const drawn: { x: number; y: number }[] = [pts[0]];
  let tip = pts[0];
  let dirx = 0;
  let diry = -1;
  for (let i = 1; i < pts.length; i++) {
    const segLen = segs[i - 1];
    if (acc + segLen <= target) {
      drawn.push(pts[i]);
      tip = pts[i];
      dirx = pts[i].x - pts[i - 1].x;
      diry = pts[i].y - pts[i - 1].y;
      acc += segLen;
    } else {
      const u = (target - acc) / segLen;
      tip = { x: lerp(pts[i - 1].x, pts[i].x, u), y: lerp(pts[i - 1].y, pts[i].y, u) };
      drawn.push(tip);
      dirx = pts[i].x - pts[i - 1].x;
      diry = pts[i].y - pts[i - 1].y;
      break;
    }
  }
  let d = `M ${drawn[0].x.toFixed(1)} ${drawn[0].y.toFixed(1)}`;
  for (let i = 1; i < drawn.length; i++) d += ` L ${drawn[i].x.toFixed(1)} ${drawn[i].y.toFixed(1)}`;
  // Ok başı
  const len = Math.hypot(dirx, diry) || 1;
  const ux = dirx / len;
  const uy = diry / len;
  const ah = 9;
  const bx = tip.x - ux * ah;
  const by = tip.y - uy * ah;
  const px = -uy;
  const py = ux;
  d += ` M ${(bx + px * 5).toFixed(1)} ${(by + py * 5).toFixed(1)} L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L ${(bx - px * 5).toFixed(1)} ${(by - py * 5).toFixed(1)}`;
  return d;
}
