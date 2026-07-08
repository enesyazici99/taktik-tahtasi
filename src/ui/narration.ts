// ============================================================================
// Sesli anlatım — aktif fazın koçluk notunu Web Speech ile okur (tr-TR).
// ============================================================================

export interface Narration {
  enabled(): boolean;
  toggle(): boolean;
  speak(text: string, key: string): void;
  cancel(): void;
}

export function createNarration(): Narration {
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let on = false;
  let lastKey = '';

  function speak(text: string, key: string): void {
    if (!on || !synth || key === lastKey) return;
    lastKey = key;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    u.rate = 1.02;
    u.pitch = 1;
    synth.speak(u);
  }

  return {
    enabled: () => on,
    toggle: () => {
      on = !on;
      if (!on) synth?.cancel();
      lastKey = '';
      return on;
    },
    speak,
    cancel: () => synth?.cancel(),
  };
}
