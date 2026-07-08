import type { Stage } from '../stage';
import type { CompiledScenario, Vec } from '../types';
import { compileFrames, type EditorDoc, type EditorFrame } from './editorCompile';

// ============================================================================
// Drag&drop kare-tabanlı senaryo editörü + JSON dışa/içe aktarma.
// ============================================================================

export interface Editor {
  el: HTMLElement;
  open(base: { title: string; positions: Record<string, Vec>; ball: string }): void;
  close(): void;
  isOpen(): boolean;
}

export function createEditor(stage: Stage, onPlay: (sc: CompiledScenario) => void, onClose: () => void): Editor {
  const el = document.createElement('div');
  el.className = 'editor-bar';
  el.style.display = 'none';

  let doc: EditorDoc = { id: 'custom', title: 'Özel', frames: [], frameMs: 1500 };
  let idx = 0;
  let open = false;
  let dragId: string | null = null;

  el.innerHTML = `
    <div class="editor-row">
      <button class="ctrl" data-a="prev" title="Önceki kare">◀</button>
      <span class="editor-frame" data-el="counter">Kare 1</span>
      <button class="ctrl" data-a="next" title="Sonraki kare">▶</button>
      <button class="ctrl" data-a="add" title="Kare ekle">＋</button>
      <button class="ctrl" data-a="dup" title="Kareyi kopyala">⧉</button>
      <button class="ctrl" data-a="del" title="Kareyi sil">🗑</button>
    </div>
    <div class="editor-row">
      <span class="editor-hint">Oyuncuyu sürükle · topu vermek için oyuncuya tıkla</span>
    </div>
    <div class="editor-row">
      <button class="ctrl wide primary" data-a="play">▶ Önizle</button>
      <button class="ctrl" data-a="export" title="JSON indir">💾</button>
      <button class="ctrl" data-a="import" title="JSON yükle">📂</button>
      <button class="ctrl" data-a="exit" title="Çık">✕</button>
    </div>
    <input type="file" accept="application/json" data-el="file" hidden />
  `;

  const counter = el.querySelector<HTMLElement>('[data-el="counter"]')!;
  const fileInput = el.querySelector<HTMLInputElement>('[data-el="file"]')!;

  function renderFrame(): void {
    stage.clock.pause();
    const f = doc.frames[idx];
    if (!f) return;
    for (const id of stage.playerIds) {
      const p = f.positions[id];
      if (p) {
        stage.setVisible(id, true);
        stage.placeById(id, p);
      } else {
        stage.setVisible(id, false);
      }
    }
    stage.hideBall();
    // Taşıyıcıyı halka ile göster
    const bp = f.positions[f.ball];
    stage.drawStaticAnnotations(bp ? [{ kind: 'ring', pos: bp, opacity: 1 }] : []);
    counter.textContent = `Kare ${idx + 1}/${doc.frames.length}`;
  }

  // --- Sürükleme ---
  function onPointerDown(e: PointerEvent): void {
    if (!open) return;
    const target = (e.target as Element).closest('.player') as SVGGElement | null;
    if (!target) return;
    const id = stage.playerIds.find((pid) => stage.playerNode(pid) === target);
    if (!id) return;
    dragId = id;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent): void {
    if (!open || !dragId) return;
    const p = clamp01v(stage.screenToNorm(e.clientX, e.clientY));
    doc.frames[idx].positions[dragId] = p;
    stage.placeById(dragId, p);
    if (dragId === doc.frames[idx].ball) {
      stage.drawStaticAnnotations([{ kind: 'ring', pos: p, opacity: 1 }]);
    }
  }
  function onPointerUp(e: PointerEvent): void {
    if (dragId && Math.hypot(0, 0) === 0) {
      // Tıklama (kısa) → topu bu oyuncuya ver
    }
    dragId = null;
    void e;
  }
  // Topu atamak için ayrı tıklama
  function onClick(e: MouseEvent): void {
    if (!open) return;
    const target = (e.target as Element).closest('.player') as SVGGElement | null;
    if (!target) return;
    const id = stage.playerIds.find((pid) => stage.playerNode(pid) === target);
    if (!id || !id.startsWith('u')) return; // topu bizimkine ver
    doc.frames[idx].ball = id;
    renderFrame();
  }

  el.querySelector('[data-a="prev"]')!.addEventListener('click', () => {
    idx = Math.max(0, idx - 1);
    renderFrame();
  });
  el.querySelector('[data-a="next"]')!.addEventListener('click', () => {
    idx = Math.min(doc.frames.length - 1, idx + 1);
    renderFrame();
  });
  el.querySelector('[data-a="add"]')!.addEventListener('click', () => {
    const blank = cloneFrame(doc.frames[idx]);
    doc.frames.splice(idx + 1, 0, blank);
    idx++;
    renderFrame();
  });
  el.querySelector('[data-a="dup"]')!.addEventListener('click', () => {
    doc.frames.splice(idx + 1, 0, cloneFrame(doc.frames[idx]));
    idx++;
    renderFrame();
  });
  el.querySelector('[data-a="del"]')!.addEventListener('click', () => {
    if (doc.frames.length <= 1) return;
    doc.frames.splice(idx, 1);
    idx = Math.min(idx, doc.frames.length - 1);
    renderFrame();
  });
  el.querySelector('[data-a="play"]')!.addEventListener('click', () => {
    const sc = compileFrames({ ...doc });
    stage.showBall();
    onPlay(sc);
  });
  el.querySelector('[data-a="export"]')!.addEventListener('click', () => exportJSON());
  el.querySelector('[data-a="import"]')!.addEventListener('click', () => fileInput.click());
  el.querySelector('[data-a="exit"]')!.addEventListener('click', () => close());
  fileInput.addEventListener('change', () => importJSON());

  function exportJSON(): void {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.id || 'senaryo'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON(): void {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as EditorDoc;
        if (!parsed.frames?.length) throw new Error('kare yok');
        doc = parsed;
        idx = 0;
        renderFrame();
      } catch (err) {
        alert('JSON okunamadı: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  }

  function openEditor(base: { title: string; positions: Record<string, Vec>; ball: string }): void {
    doc = {
      id: 'custom-' + base.title.toLowerCase().replace(/\s+/g, '-'),
      title: base.title,
      frames: [{ positions: { ...base.positions }, ball: base.ball, title: 'Başlangıç' }],
      frameMs: 1500,
    };
    idx = 0;
    open = true;
    el.style.display = '';
    stage.svg.addEventListener('pointerdown', onPointerDown);
    stage.svg.addEventListener('pointermove', onPointerMove);
    stage.svg.addEventListener('pointerup', onPointerUp);
    stage.svg.addEventListener('click', onClick);
    renderFrame();
  }

  function close(): void {
    open = false;
    el.style.display = 'none';
    stage.svg.removeEventListener('pointerdown', onPointerDown);
    stage.svg.removeEventListener('pointermove', onPointerMove);
    stage.svg.removeEventListener('pointerup', onPointerUp);
    stage.svg.removeEventListener('click', onClick);
    stage.showBall();
    onClose();
  }

  return { el, open: openEditor, close, isOpen: () => open };
}

function cloneFrame(f: EditorFrame): EditorFrame {
  const positions: Record<string, Vec> = {};
  for (const [k, v] of Object.entries(f.positions)) positions[k] = { x: v.x, y: v.y };
  return { positions, ball: f.ball, title: f.title, note: f.note };
}

function clamp01v(p: Vec): Vec {
  return { x: Math.max(0, Math.min(1, p.x)), y: Math.max(0, Math.min(1, p.y)) };
}
