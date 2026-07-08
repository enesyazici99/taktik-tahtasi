// ============================================================================
// Playback saati. Hız çarpanı, loop, oynat/durdur, seek. requestAnimationFrame
// sürer ama zaman DURUMU sadece burada; render(t) tamamen saf kalır.
// ============================================================================

export type Speed = number; // 0.5 / 0.75 / 1 ...

export interface ClockState {
  t: number; // senaryo içi zaman (ms)
  playing: boolean;
  speed: Speed;
}

export class Clock {
  private t = 0;
  private playing = false;
  private speed: Speed = 0.75; // varsayılan yavaş — okunaklı tempo
  private duration = 1;
  private loop = true;
  private stepMode = true; // adım-adım varsayılan açık: her adım sonunda dur
  private lastRaf = 0;
  private rafId = 0;
  private phaseEnds: number[] = []; // adım-adım için faz sınırları
  private nextStepStop = Infinity;

  onFrame: (t: number) => void = () => {};
  onStateChange: (s: ClockState) => void = () => {};

  setDuration(ms: number): void {
    this.duration = Math.max(1, ms);
    if (this.t > this.duration) this.t = 0;
  }

  setPhaseEnds(ends: number[]): void {
    this.phaseEnds = ends.slice().sort((a, b) => a - b);
  }

  setStepMode(on: boolean): void {
    this.stepMode = on;
    this.armNextStep();
  }

  getState(): ClockState {
    return { t: this.t, playing: this.playing, speed: this.speed };
  }

  getTime(): number {
    return this.t;
  }
  getDuration(): number {
    return this.duration;
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.armNextStep();
    this.lastRaf = 0;
    this.loopFrame(performance.now());
    this.emit();
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.emit();
  }

  toggle(): void {
    this.playing ? this.pause() : this.play();
  }

  restart(): void {
    this.seek(0);
    this.play();
  }

  setSpeed(s: Speed): void {
    this.speed = s;
    this.emit();
  }

  /** Zamanı doğrudan ayarla (scrubber / faz seek). Oynatmayı bozmadan. */
  seek(ms: number, opts: { render?: boolean } = { render: true }): void {
    this.t = Math.max(0, Math.min(this.duration, ms));
    this.armNextStep();
    if (opts.render !== false) this.onFrame(this.t);
    this.emit();
  }

  /** Bir sonraki adım-adım duraklama noktasını kur. */
  private armNextStep(): void {
    if (!this.stepMode) {
      this.nextStepStop = Infinity;
      return;
    }
    const next = this.phaseEnds.find((e) => e > this.t + 1);
    this.nextStepStop = next ?? Infinity;
  }

  private loopFrame = (now: number): void => {
    if (!this.playing) return;
    if (this.lastRaf === 0) this.lastRaf = now;
    let dt = (now - this.lastRaf) * this.speed;
    this.lastRaf = now;
    // Uzun sekmeler / arka plandan dönüşte sıçramayı sınırla
    if (dt > 250) dt = 16 * this.speed;

    let nt = this.t + dt;

    // Adım-adım: faz sınırında duraklat
    if (nt >= this.nextStepStop) {
      this.t = this.nextStepStop;
      this.onFrame(this.t);
      this.pause();
      return;
    }

    if (nt >= this.duration) {
      nt = this.loop ? nt - this.duration : this.duration;
      if (!this.loop) {
        this.t = this.duration;
        this.onFrame(this.t);
        this.pause();
        return;
      }
    }
    this.t = nt;
    this.onFrame(this.t);
    this.rafId = requestAnimationFrame(this.loopFrame);
  };

  private emit(): void {
    this.onStateChange(this.getState());
  }
}
