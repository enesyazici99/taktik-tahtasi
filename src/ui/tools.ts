import type { Stage } from '../stage';
import type { CompiledScenario } from '../types';

// v2 araçlar menüsü (editör, export, varyant, ses, analiz) burada bağlanır.
// Faz 4'te yer tutucu; v2 adımında doldurulur.
export function mountTools(
  _btn: HTMLElement,
  _stage: Stage,
  _getCurrent: () => CompiledScenario,
  _select: (sc: CompiledScenario) => void,
): void {
  // v2'de doldurulacak
}
