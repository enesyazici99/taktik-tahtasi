import {
  GROUP_LABELS,
  GROUP_ORDER,
  scenariosByGroup,
} from '../scenarios';
import type { CompiledScenario, GroupId } from '../types';

// ============================================================================
// Grup sekmeleri + senaryo chip'leri. Mobilde yatay scroll.
// ============================================================================

export interface ScenarioList {
  el: HTMLElement;
  select(id: string): void;
  current(): CompiledScenario | null;
}

export function createScenarioList(onSelect: (sc: CompiledScenario) => void): ScenarioList {
  const el = document.createElement('div');

  const tabs = document.createElement('div');
  tabs.className = 'group-tabs';
  const chips = document.createElement('div');
  chips.className = 'scenario-chips';
  el.append(tabs, chips);

  // İlk dolu grupla başla (boş grubu gösterme)
  let activeGroup: GroupId = GROUP_ORDER.find((g) => scenariosByGroup(g).length > 0) ?? GROUP_ORDER[0];
  let activeId = scenariosByGroup(activeGroup)[0]?.id ?? '';

  const groupBtns = new Map<GroupId, HTMLButtonElement>();
  for (const g of GROUP_ORDER) {
    const b = document.createElement('button');
    b.className = 'group-tab';
    b.textContent = GROUP_LABELS[g];
    b.onclick = () => {
      activeGroup = g;
      renderChips();
      const list = scenariosByGroup(g);
      if (list.length) select(list[0].id);
      syncTabs();
    };
    groupBtns.set(g, b);
    tabs.appendChild(b);
  }

  function syncTabs(): void {
    for (const [g, b] of groupBtns) b.classList.toggle('active', g === activeGroup);
  }

  function renderChips(): void {
    chips.innerHTML = '';
    for (const sc of scenariosByGroup(activeGroup)) {
      const c = document.createElement('button');
      c.className = 'chip';
      c.textContent = sc.title;
      c.dataset.id = sc.id;
      c.classList.toggle('active', sc.id === activeId);
      c.onclick = () => select(sc.id);
      chips.appendChild(c);
    }
  }

  function select(id: string): void {
    const sc = scenariosByGroup(activeGroup).find((s) => s.id === id);
    if (!sc) return;
    activeId = id;
    for (const c of chips.querySelectorAll<HTMLButtonElement>('.chip')) {
      c.classList.toggle('active', c.dataset.id === id);
    }
    // Aktif chip'i görünür kaydır
    const activeChip = chips.querySelector<HTMLElement>('.chip.active');
    activeChip?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    onSelect(sc);
  }

  // Herhangi bir gruptaki id ile seçim (hash router için)
  function selectAny(id: string): void {
    for (const g of GROUP_ORDER) {
      if (scenariosByGroup(g).some((s) => s.id === id)) {
        activeGroup = g;
        syncTabs();
        renderChips();
        select(id);
        return;
      }
    }
  }

  syncTabs();
  renderChips();

  return {
    el,
    select: selectAny,
    current: () => scenariosByGroup(activeGroup).find((s) => s.id === activeId) ?? null,
  };
}
