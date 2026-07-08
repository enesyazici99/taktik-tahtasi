import { COLORS } from '../data/constants';
import type { PlayerDef, Vec } from '../types';
import { toPx } from './pitch';
import { el, group } from './svg';

// ============================================================================
// Oyuncu + top node'ları. Havuzlanır (yaratıp silme yok); her frame sadece
// transform/attr güncellenir → reflow tetiklenmez.
// ============================================================================

const PLAYER_R = 17;

export interface PlayerNode {
  def: PlayerDef;
  g: SVGGElement;
}

export interface EntityLayer {
  players: Record<string, PlayerNode>;
  ballG: SVGGElement;
  ballCore: SVGCircleElement;
  ballShadow: SVGEllipseElement;
  trail: SVGCircleElement[];
}

export function createEntities(
  playersLayer: SVGGElement,
  ballLayer: SVGGElement,
  players: PlayerDef[],
): EntityLayer {
  const nodes: Record<string, PlayerNode> = {};

  for (const def of players) {
    const g = group(`player ${def.team}`, playersLayer);
    const isUsGk = def.team === 'us' && def.gk;
    const isThemGk = def.team === 'them' && def.gk;
    const fill = isUsGk
      ? COLORS.usGk
      : isThemGk
        ? COLORS.themGk
        : def.team === 'us'
          ? COLORS.us
          : COLORS.them;
    const textColor = def.team === 'us' ? COLORS.usNumber : COLORS.themNumber;

    // Yön göstergesi (küçük ok/kama) — facing ile döner
    el(
      'path',
      {
        class: 'facing',
        d: `M 0 ${-PLAYER_R - 6} L -4 ${-PLAYER_R + 1} L 4 ${-PLAYER_R + 1} Z`,
        fill: COLORS.accent,
        opacity: 0.0,
      },
      g,
    );

    el(
      'circle',
      {
        r: PLAYER_R,
        fill,
        stroke: def.team === 'us' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)',
        'stroke-width': 2,
      },
      g,
    );
    el(
      'text',
      {
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-family': "'Barlow Condensed', sans-serif",
        'font-weight': 600,
        'font-size': def.label.length > 1 ? 20 : 22,
        fill: textColor,
        y: 1,
      },
      g,
    ).textContent = def.label;

    nodes[def.id] = { def, g };
  }

  // Top: gölge (altta) + çekirdek + iz noktaları
  const ballShadow = el(
    'ellipse',
    { rx: 8, ry: 4, fill: 'rgba(0,0,0,0.35)', cx: 0, cy: 6 },
    ballLayer,
  );
  const trail: SVGCircleElement[] = [];
  for (let i = 0; i < 4; i++) {
    trail.push(
      el('circle', { r: 4, fill: COLORS.chalk, opacity: 0 }, ballLayer),
    );
  }
  const ballG = group('ball', ballLayer);
  const ballCore = el(
    'circle',
    { r: 7, fill: COLORS.chalk, stroke: '#111', 'stroke-width': 1.5 },
    ballG,
  );

  return { players: nodes, ballG, ballCore, ballShadow, trail };
}

/** Bir oyuncuyu verilen normalize konuma yerleştirir. facing NaN → ok gizli. */
export function placePlayer(node: PlayerNode, pos: Vec, facing = NaN): void {
  const p = toPx(pos);
  node.g.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
  const face = node.g.querySelector('.facing') as SVGPathElement | null;
  if (face) {
    if (Number.isNaN(facing)) {
      face.setAttribute('opacity', '0');
    } else {
      face.setAttribute('opacity', '0.5');
      face.setAttribute('transform', `rotate(${((facing * 180) / Math.PI).toFixed(1)})`);
    }
  }
}
