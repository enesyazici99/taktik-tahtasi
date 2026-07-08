import { COLORS } from '../data/constants';
import type { Stage } from '../stage';
import type { CompiledScenario } from '../types';

// ============================================================================
// Video (WebM) export — SVG kareleri canvas'a çizip MediaRecorder ile kaydeder.
// Gerçek zamanlı tempoda; kayıt bitince .webm indirilir.
// ============================================================================

export function canExport(): boolean {
  return typeof MediaRecorder !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;
}

export async function exportWebM(
  stage: Stage,
  sc: CompiledScenario,
  onProgress: (p: number) => void,
): Promise<void> {
  const scale = 0.6;
  const W = Math.round(680 * scale);
  const H = Math.round(1000 * scale);
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
  const total = Math.ceil(duration / frameDt);

  for (let i = 0; i <= total; i++) {
    const t = Math.min(duration, i * frameDt);
    stage.render(t);
    await blitSvg(ctx, stage.svg, W, H);
    onProgress(t / duration);
    await sleep(frameDt); // gerçek zamanlı tempo
  }

  recorder.stop();
  await done;
  if (wasPlaying) stage.clock.play();
}

/** SVG'yi bir kareye çizer (arka planı doldurup üstüne bindirir). */
function blitSvg(ctx: CanvasRenderingContext2D, svg: SVGSVGElement, W: number, H: number): Promise<void> {
  return new Promise((resolve) => {
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = svg64;
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
