import { COLORS, DESIGN } from '../data/constants';
import type { Vec } from '../types';
import { el, group } from './svg';

// ============================================================================
// Statik saha çizimi — bir kez oluşturulur. Normalize (0..1) → tasarım alanı.
// Ofsayt yok → ekstra çizgi yok.
// ============================================================================

const { width: W, height: H, margin: M } = DESIGN;
const IW = W - 2 * M; // iç genişlik
const IH = H - 2 * M; // iç yükseklik

/** Normalize koordinatı SVG tasarım koordinatına çevirir. */
export function toPx(v: Vec): { x: number; y: number } {
  return { x: M + v.x * IW, y: M + v.y * IH };
}

/** Normalize skaler mesafeyi (y ekseni referanslı) piksel yarıçapına çevirir. */
export function scaleR(r: number): number {
  return r * IH;
}

export function drawPitch(root: SVGSVGElement): SVGGElement {
  const g = group('pitch-layer', root);

  // Arka plan
  el('rect', { x: 0, y: 0, width: W, height: H, fill: COLORS.bg }, g);

  // Çim dokusu: yatay şeritler
  const stripes = 10;
  for (let i = 0; i < stripes; i++) {
    const y = M + (i / stripes) * IH;
    el(
      'rect',
      {
        x: M,
        y,
        width: IW,
        height: IH / stripes,
        fill: i % 2 === 0 ? COLORS.pitch : COLORS.pitchLine,
        opacity: 0.55,
      },
      g,
    );
  }

  // Saha zemini (üstte hafif koyu overlay ile derinlik)
  el(
    'rect',
    { x: M, y: M, width: IW, height: IH, fill: COLORS.pitch, opacity: 0.35 },
    g,
  );

  const line = (attrs: Record<string, string | number>) =>
    el('line', { stroke: COLORS.chalkDim, 'stroke-width': 2.5, ...attrs }, g);
  const rect = (attrs: Record<string, string | number>) =>
    el(
      'rect',
      { fill: 'none', stroke: COLORS.chalkDim, 'stroke-width': 2.5, ...attrs },
      g,
    );

  // Dış çizgi
  rect({ x: M, y: M, width: IW, height: IH, rx: 4 });

  // Orta çizgi
  line({ x1: M, y1: H / 2, x2: W - M, y2: H / 2 });

  // Orta yuvarlak + nokta
  el(
    'circle',
    {
      cx: W / 2,
      cy: H / 2,
      r: scaleR(0.1),
      fill: 'none',
      stroke: COLORS.chalkDim,
      'stroke-width': 2.5,
    },
    g,
  );
  el('circle', { cx: W / 2, cy: H / 2, r: 4, fill: COLORS.chalkDim }, g);

  // Ceza sahaları ve penaltı noktaları (üst = rakip, alt = biz)
  const boxW = IW * 0.55;
  const boxH = IH * 0.14;
  const gArea6W = IW * 0.28;
  const gArea6H = IH * 0.06;

  // Üst (rakip) ceza sahası
  rect({ x: M + (IW - boxW) / 2, y: M, width: boxW, height: boxH });
  rect({ x: M + (IW - gArea6W) / 2, y: M, width: gArea6W, height: gArea6H });
  el('circle', { cx: W / 2, cy: M + IH * 0.11, r: 3.5, fill: COLORS.chalkDim }, g);

  // Alt (biz) ceza sahası
  rect({ x: M + (IW - boxW) / 2, y: H - M - boxH, width: boxW, height: boxH });
  rect({ x: M + (IW - gArea6W) / 2, y: H - M - gArea6H, width: gArea6W, height: gArea6H });
  el('circle', { cx: W / 2, cy: H - M - IH * 0.11, r: 3.5, fill: COLORS.chalkDim }, g);

  // Kaleler (kısa kalın çizgi)
  const goalW = IW * 0.22;
  el('rect', { x: W / 2 - goalW / 2, y: M - 6, width: goalW, height: 6, fill: COLORS.chalkDim, opacity: 0.5 }, g);
  el('rect', { x: W / 2 - goalW / 2, y: H - M, width: goalW, height: 6, fill: COLORS.chalkDim, opacity: 0.5 }, g);

  return g;
}
