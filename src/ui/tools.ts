import type { Stage } from '../stage';
import type { CompiledScenario } from '../types';
import { canExport, exportWebM } from './videoExport';

// ============================================================================
// Sade araçlar: "Nasıl kullanılır?" yardımı + videoyu indir. (Editör / analiz /
// sesli anlatım kaldırıldı — amaç: kimsenin kafası karışmadan izlemek.)
// ============================================================================

export function mountTools(opts: {
  helpBtn: HTMLElement;
  videoBtn: HTMLElement;
  stage: Stage;
  getCurrent: () => CompiledScenario;
}): void {
  const { helpBtn, videoBtn, stage, getCurrent } = opts;

  // --- Yardım overlay ---
  const help = document.createElement('div');
  help.className = 'help-overlay';
  help.style.display = 'none';
  help.innerHTML = `
    <div class="help-box">
      <h2>Nasıl kullanılır?</h2>
      <ol>
        <li><b>Senaryo seç:</b> Üstten grup (Hücum, Pres, Çıkış…) ve senaryo seç.</li>
        <li><b>Adımları izle:</b> Her taktik adım adım oynar. Alttaki kartta o adımda
          kimin ne yapması gerektiği yazar.</li>
        <li><b>İlerle:</b> Adım bitince durur — okuyunca <b>“Sonraki adım ▶”</b>e bas.
          <b>“◀”</b> ile geri dönebilirsin.</li>
        <li><b>Tamamını izle:</b> <b>“Baştan tümünü izle”</b> ile senaryoyu kesintisiz oynat.</li>
        <li><b>Hız:</b> Yavaş/normal arasında değiştir. <b>⬇</b> ile videoyu indirip
          WhatsApp’tan takıma at.</li>
      </ol>
      <p class="help-tip">Halısahada ofsayt yok — bütün senaryolar buna göre kurgulandı.</p>
      <button class="ctrl primary help-close">Anladım</button>
    </div>
  `;
  document.body.appendChild(help);

  const showHelp = () => (help.style.display = '');
  const hideHelp = () => (help.style.display = 'none');
  helpBtn.addEventListener('click', showHelp);
  help.querySelector('.help-close')!.addEventListener('click', hideHelp);
  help.addEventListener('click', (e) => {
    if (e.target === help) hideHelp();
  });

  // İlk ziyarette otomatik göster
  try {
    if (!localStorage.getItem('tt-help-seen')) {
      showHelp();
      localStorage.setItem('tt-help-seen', '1');
    }
  } catch {
    /* localStorage kapalı olabilir */
  }

  // --- Video indir ---
  videoBtn.addEventListener('click', async () => {
    if (!canExport()) {
      alert('Bu tarayıcı video kaydını desteklemiyor. Chrome deneyin.');
      return;
    }
    const overlay = progressOverlay('Video hazırlanıyor…');
    try {
      await exportWebM(stage, getCurrent(), (p) => overlay.set(p));
    } catch (e) {
      alert('Video oluşturulamadı: ' + (e as Error).message);
    } finally {
      overlay.remove();
    }
  });
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
