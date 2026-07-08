import { compileScenario } from '../engine/compiler';
import type { ScenarioDef } from '../engine/dsl';
import type { CompiledScenario, GroupId } from '../types';

// Senaryo kayıt + gruplama. Yeni senaryo: dosyayı içe aktar, DEFS'e ekle.
import c1 from './cikis/c1-ucuncu-adam';

export const GROUP_LABELS: Record<GroupId, string> = {
  hucum: 'Hücum',
  pres: 'Pres',
  cikis: 'Çıkış',
  savunma: 'Savunma',
  gecis: 'Geçiş',
};

export const GROUP_ORDER: GroupId[] = ['hucum', 'pres', 'cikis', 'savunma', 'gecis'];

const DEFS: ScenarioDef[] = [c1];

/** Tüm senaryoları derle. Hatalı olan atlanır ve konsola yazılır. */
function compileAll(defs: ScenarioDef[]): CompiledScenario[] {
  const out: CompiledScenario[] = [];
  for (const d of defs) {
    try {
      out.push(compileScenario(d));
    } catch (e) {
      console.error('Senaryo derlenemedi:', (e as Error).message);
    }
  }
  return out;
}

export const SCENARIOS: CompiledScenario[] = compileAll(DEFS);

export const SCENARIO_BY_ID: Record<string, CompiledScenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);

export function scenariosByGroup(group: GroupId): CompiledScenario[] {
  return SCENARIOS.filter((s) => s.group === group);
}

export function firstScenario(): CompiledScenario {
  return SCENARIOS[0];
}
