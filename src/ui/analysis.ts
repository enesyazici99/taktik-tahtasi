import type { Stage } from '../stage';
import type { CompiledScenario, ResolvedAnnotation, Vec } from '../types';

// ============================================================================
// Rakip analiz modu — rakip dizilişine göre zayıf (boş) bölgeleri vurgular.
// Rakip oyuncuları sürüklenebilir; her değişimde yeniden hesaplanır.
// Sezgi: hücum yarısında rakiplere en uzak ızgara hücreleri = zayıf bölge.
// ============================================================================

export interface Analysis {
  el: HTMLElement;
  open(sc: CompiledScenario): void;
  close(): void;
  isOpen(): boolean;
}

export function createAnalysis(stage: Stage, onClose: () => void): Analysis {
  const el = document.createElement('div');
  el.className = 'editor-bar';
  el.style.display = 'none';
  el.innerHTML = `
    <div class="editor-row">
      <span class="editor-hint">🎯 Rakip (kırmızı) oyuncuları sürükle → zayıf bölgeler güncellenir</span>
    </div>
    <div class="editor-row">
      <button class="ctrl wide primary" data-a="recalc">Yeniden hesapla</button>
      <button class="ctrl" data-a="exit">✕</button>
    </div>
  `;

  let open = false;
  let dragId: string | null = null;
  const themPos: Record<string, Vec> = {};

  function recompute(): void {
    const zones = weakZones(Object.values(themPos));
    const anns: ResolvedAnnotation[] = zones.map((z, i) => ({
      kind: 'zone' as const,
      center: z,
      rx: 0.12,
      ry: 0.09,
      label: i === 0 ? 'en zayıf' : 'zayıf',
      opacity: i === 0 ? 0.9 : 0.6,
    }));
    stage.drawStaticAnnotations(anns);
  }

  function renderStatic(sc: CompiledScenario): void {
    stage.clock.pause();
    for (const id of stage.playerIds) {
      const p = sc.formation.positions[id];
      if (p) {
        stage.setVisible(id, true);
        stage.placeById(id, p);
        if (id.startsWith('r')) themPos[id] = { x: p.x, y: p.y };
      } else {
        stage.setVisible(id, false);
      }
    }
    stage.hideBall();
    recompute();
  }

  function onDown(e: PointerEvent): void {
    if (!open) return;
    const target = (e.target as Element).closest('.player.them') as SVGGElement | null;
    if (!target) return;
    dragId = stage.playerIds.find((id) => stage.playerNode(id) === target) ?? null;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onMove(e: PointerEvent): void {
    if (!open || !dragId) return;
    const p = clamp01(stage.screenToNorm(e.clientX, e.clientY));
    themPos[dragId] = p;
    stage.placeById(dragId, p);
    recompute();
  }
  function onUp(): void {
    dragId = null;
  }

  el.querySelector('[data-a="recalc"]')!.addEventListener('click', recompute);
  el.querySelector('[data-a="exit"]')!.addEventListener('click', () => close());

  function openMode(sc: CompiledScenario): void {
    open = true;
    el.style.display = '';
    stage.svg.addEventListener('pointerdown', onDown);
    stage.svg.addEventListener('pointermove', onMove);
    stage.svg.addEventListener('pointerup', onUp);
    renderStatic(sc);
  }
  function close(): void {
    open = false;
    el.style.display = 'none';
    stage.svg.removeEventListener('pointerdown', onDown);
    stage.svg.removeEventListener('pointermove', onMove);
    stage.svg.removeEventListener('pointerup', onUp);
    stage.showBall();
    onClose();
  }

  return { el, open: openMode, close, isOpen: () => open };
}

/** Hücum yarısında rakiplere en uzak ızgara noktaları. */
function weakZones(them: Vec[]): Vec[] {
  const cells: { p: Vec; d: number }[] = [];
  for (let gx = 1; gx <= 5; gx++) {
    for (let gy = 1; gy <= 4; gy++) {
      const p = { x: gx / 6, y: 0.1 + (gy / 5) * 0.45 }; // hücum yarısı (üst)
      let min = Infinity;
      for (const t of them) min = Math.min(min, Math.hypot(t.x - p.x, t.y - p.y));
      cells.push({ p, d: min });
    }
  }
  cells.sort((a, b) => b.d - a.d);
  // İlk iki farklı bölge (birbirine çok yakın olmayan)
  const out: Vec[] = [cells[0].p];
  for (const c of cells.slice(1)) {
    if (out.every((o) => Math.hypot(o.x - c.p.x, o.y - c.p.y) > 0.2)) {
      out.push(c.p);
      break;
    }
  }
  return out;
}

function clamp01(p: Vec): Vec {
  return { x: Math.max(0, Math.min(1, p.x)), y: Math.max(0, Math.min(1, p.y)) };
}
