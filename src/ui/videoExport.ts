import { COLORS } from '../data/constants';
import type { Stage } from '../stage';
import type { CompiledScenario, Phase } from '../types';

// ============================================================================
// Video (WebM) export — SVG kareleri canvas'a çizer, altına aktif adımın
// başlığı + direktifini gömer (video tek başına anlaşılır olsun), MediaRecorder
// ile kaydeder. Biraz yavaş tempo (okunabilir).
// ============================================================================

const PLAY_RATE = 0.8; // videoyu hafifçe yavaşlat

export function canExport(): boolean {
  return typeof MediaRecorder !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;
}

export async function exportWebM(
  stage: Stage,
  sc: CompiledScenario,
  onProgress: (p: number) => void,
): Promise<void> {
  const scale = 0.62;
  const W = Math.round(680 * scale);
  const CAPTION = 96;
  const H = Math.round(1000 * scale) + CAPTION;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const fps = 25;
  const stream = canvas.captureStream(fps);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const wasPlaying = stage.clock.getState().playing;
  stage.clock.pause();

  const done = new Promise<void>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sc.id}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    };
  });

  recorder.start();
  const duration = sc.duration;
  const frameDt = 1000 / fps;
  const advance = frameDt * PLAY_RATE;
  const total = Math.ceil(duration / advance);

  for (let i = 0; i <= total; i++) {
    const t = Math.min(duration, i * advance);
    stage.render(t);
    await blitSvg(ctx, stage.svg, W, H, CAPTION);
    drawCaption(ctx, W, H, CAPTION, sc, phaseAt(sc, t));
    onProgress(t / duration);
    await sleep(frameDt);
  }

  recorder.stop();
  await done;
  if (wasPlaying) stage.clock.play();
}

function phaseAt(sc: CompiledScenario, t: number): Phase {
  let p = sc.phases[0];
  for (const ph of sc.phases) if (t >= ph.t0) p = ph;
  return p;
}

function blitSvg(
  ctx: CanvasRenderingContext2D,
  svg: SVGSVGElement,
  W: number,
  H: number,
  caption: number,
): Promise<void> {
  return new Promise((resolve) => {
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H - caption);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = svg64;
  });
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  caption: number,
  sc: CompiledScenario,
  ph: Phase,
): void {
  const y0 = H - caption;
  ctx.fillStyle = '#141b18';
  ctx.fillRect(0, y0, W, caption);
  // Sarı tebeşir kenarı
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(0, y0, 4, caption);

  const n = sc.phases.indexOf(ph) + 1;
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLORS.accent;
  ctx.font = '600 15px "Barlow Condensed", sans-serif';
  ctx.fillText(`ADIM ${n}/${sc.phases.length} · ${ph.title.toUpperCase()}`, 14, y0 + 12);

  ctx.fillStyle = COLORS.chalk;
  ctx.font = '400 15px Inter, sans-serif';
  wrapText(ctx, ph.note, 14, y0 + 36, W - 28, 19);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number,
): void {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
