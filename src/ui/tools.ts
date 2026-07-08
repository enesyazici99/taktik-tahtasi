import { US_VARIANTS } from '../data/formations';
import type { Stage } from '../stage';
import type { CompiledScenario } from '../types';
import { createAnalysis } from './analysis';
import { createEditor } from './editor';
import { createNarration, type Narration } from './narration';
import { canExport, exportWebM } from './videoExport';

// ============================================================================
// v2 araçlar menüsü: editör, video export, dizilim varyantı, sesli anlatım,
// rakip analiz modu.
// ============================================================================

export interface Tools {
  narration: Narration;
}

export function mountTools(
  btn: HTMLElement,
  stage: Stage,
  getCurrent: () => CompiledScenario,
  loadScenario: (sc: CompiledScenario) => void,
): Tools {
  const narration = createNarration();

  // Menü paneli
  const menu = document.createElement('div');
  menu.className = 'tools-menu';
  menu.style.display = 'none';
  menu.innerHTML = `
    <button class="tools-item" data-a="editor">📝 Senaryo editörü</button>
    <button class="tools-item" data-a="video">🎬 Video (WebM) kaydet</button>
    <div class="tools-sub" data-el="variants"><span class="tools-label">👕 Dizilim varyantı</span></div>
    <button class="tools-item" data-a="narration">🔊 Sesli anlatım: Kapalı</button>
    <button class="tools-item" data-a="analysis">🎯 Rakip analiz modu</button>
  `;
  document.body.appendChild(menu);

  // Dizilim varyant butonları
  const variantsWrap = menu.querySelector<HTMLElement>('[data-el="variants"]')!;
  for (const [key, vr] of Object.entries(US_VARIANTS)) {
    const b = document.createElement('button');
    b.className = 'tools-chip';
    b.textContent = vr.name;
    b.onclick = () => {
      applyVariant(key);
      hide();
    };
    variantsWrap.appendChild(b);
  }
  const normalBtn = document.createElement('button');
  normalBtn.className = 'tools-chip';
  normalBtn.textContent = 'Normal';
  normalBtn.onclick = () => {
    loadScenario(getCurrent());
    hide();
  };
  variantsWrap.appendChild(normalBtn);

  // Editör + analiz barları (kontrollerin üstüne)
  const editor = createEditor(
    stage,
    (sc) => loadScenario(sc),
    () => loadScenario(getCurrent()),
  );
  const analysis = createAnalysis(stage, () => loadScenario(getCurrent()));
  document.body.append(editor.el, analysis.el);

  function applyVariant(key: string): void {
    stage.clock.pause();
    const vr = US_VARIANTS[key];
    const cur = getCurrent();
    // Rakip mevcut formasyonda kalsın, biz varyanta geçelim
    for (const id of stage.playerIds) {
      if (id.startsWith('u')) {
        const p = vr.positions[id];
        stage.setVisible(id, !!p);
        if (p) stage.placeById(id, p);
      } else {
        const p = cur.formation.positions[id];
        stage.setVisible(id, !!p);
        if (p) stage.placeById(id, p);
      }
    }
    stage.hideBall();
  }

  let visible = false;
  function show(): void {
    const r = btn.getBoundingClientRect();
    menu.style.top = `${r.bottom + 6}px`;
    menu.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
    menu.style.display = '';
    visible = true;
  }
  function hide(): void {
    menu.style.display = 'none';
    visible = false;
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    visible ? hide() : show();
  });
  document.addEventListener('click', (e) => {
    if (visible && !menu.contains(e.target as Node)) hide();
  });

  menu.querySelector('[data-a="editor"]')!.addEventListener('click', () => {
    hide();
    const sc = getCurrent();
    const ball = sc.ball.find((s) => s.kind === 'carried') as { carrierId: string } | undefined;
    editor.open({
      title: sc.title + ' (kopya)',
      positions: JSON.parse(JSON.stringify(sc.formation.positions)),
      ball: ball?.carrierId ?? 'uK',
    });
  });

  menu.querySelector('[data-a="analysis"]')!.addEventListener('click', () => {
    hide();
    analysis.open(getCurrent());
  });

  const narrBtn = menu.querySelector<HTMLButtonElement>('[data-a="narration"]')!;
  narrBtn.addEventListener('click', () => {
    const on = narration.toggle();
    narrBtn.textContent = `🔊 Sesli anlatım: ${on ? 'Açık' : 'Kapalı'}`;
  });

  const videoBtn = menu.querySelector<HTMLButtonElement>('[data-a="video"]')!;
  videoBtn.addEventListener('click', async () => {
    hide();
    if (!canExport()) {
      alert('Bu tarayıcı video kaydını desteklemiyor.');
      return;
    }
    const overlay = progressOverlay('Video kaydediliyor…');
    try {
      await exportWebM(stage, getCurrent(), (p) => overlay.set(p));
    } catch (e) {
      alert('Kayıt başarısız: ' + (e as Error).message);
    } finally {
      overlay.remove();
    }
  });

  return { narration };
}

function progressOverlay(label: string): { set: (p: number) => void; remove: () => void } {
  const o = document.createElement('div');
  o.className = 'progress-overlay';
  o.innerHTML = `<div class="progress-box"><div class="progress-label">${label}</div><div class="progress-track"><div class="progress-fill"></div></div></div>`;
  document.body.appendChild(o);
  const fill = o.querySelector<HTMLElement>('.progress-fill')!;
  return {
    set: (p) => (fill.style.width = `${Math.round(p * 100)}%`),
    remove: () => o.remove(),
  };
}
