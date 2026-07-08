import { compileScenario } from '../engine/compiler';
import type { ScenarioDef } from '../engine/dsl';
import type { CompiledScenario, GroupId } from '../types';

// Senaryo kayıt + gruplama. Yeni senaryo: dosyayı içe aktar, DEFS'e ekle.
import h1 from './hucum/h1-kanat-duvari';
import h2 from './hucum/h2-gec-binen-8';
import h3 from './hucum/h3-arka-direk';
import h4 from './hucum/h4-taraf-degistirme';
import h5 from './hucum/h5-kontra';
import p1 from './pres/p1-aut-presi';
import p2 from './pres/p2-pres-tetikleri';
import p3 from './pres/p3-pres-kirilirsa';
import c1 from './cikis/c1-ucuncu-adam';
import c2 from './cikis/c2-kaleci-switch';
import c3 from './cikis/c3-uzun-top';
import s1 from './savunma/s1-blok-kaymasi';
import s2 from './savunma/s2-kanat-savunmasi';
import s3 from './savunma/s3-libero';
import g1 from './gecis/g1-karsi-pres';
import g2 from './gecis/g2-kazanim-karari';

export const GROUP_LABELS: Record<GroupId, string> = {
  hucum: 'Hücum',
  pres: 'Pres',
  cikis: 'Çıkış',
  savunma: 'Savunma',
  gecis: 'Geçiş',
};

export const GROUP_ORDER: GroupId[] = ['hucum', 'pres', 'cikis', 'savunma', 'gecis'];

// Sıra: gruplar §12 kataloğuna göre.
const DEFS: ScenarioDef[] = [
  h1, h2, h3, h4, h5,
  p1, p2, p3,
  c1, c2, c3,
  s1, s2, s3,
  g1, g2,
];

export const SCENARIO_DEFS = DEFS;

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
