# Taktik Tahtası — 9a9 Halısaha Animasyonlu Taktik Uygulaması

Amatör bir 9a9 halısaha takımı için **tamamen animasyonlu** taktik tahtası. Statik
ok/diyagram yok — her senaryoda oyuncular ve top sürekli hareket eder, maç gibi akar.
Dizilim **3-2-3** (savunmada 3-4-1). Halısahada **ofsayt yok** kuralı tüm senaryolara işlenmiştir.

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme
npm run build      # üretim derlemesi (tsc + vite)
npm run preview    # derlemeyi önizle
npm run deploy     # GitHub Pages'e (gh-pages)
```

## Mimari

- **Vite + TypeScript**, framework yok. Render **SVG** (tek `<svg>`, katmanlı).
- Animasyon motoru kendimizin: `requestAnimationFrame` + **deterministik seekable timeline**.
- **Determinizm kuralı:** render tamamen `render(t)` saf fonksiyonudur. `Math.random` yok;
  her salınım `t`'den türetilir. Böylece scrubber, hız değişimi ve loop kusursuz çalışır.

```
src/
  engine/    clock, interpolate, compiler (DSL→CompiledScenario), behaviors, ball
  render/    pitch (statik saha), entities (havuzlu node'lar), annotations
  ui/        controls, scenarioList, phasePanel, editor
  data/      roster, formations, constants
  scenarios/ her senaryo ayrı dosya, DSL ile yazılır
```

## Yeni senaryo ekleme

Motor koduna dokunmadan yeni senaryo eklenir. `src/scenarios/<grup>/` altına bir dosya
açıp `scenario({...})` DSL'i ile yaz, sonra `src/scenarios/index.ts` içine kaydet:

```ts
export default scenario({
  id: 'h6-yeni', title: 'Yeni Senaryo', group: 'hucum', formation: F323,
  behaviors: DEFAULT_BEHAVIORS,
  phases: [
    phase('Başlık', 'Koçluk notu.', [
      pass('uK', 'u3'),
      run('u8', v(0.65, 0.5), { speed: 'sprint' }),
    ]),
  ],
});
```

Derleyici süreleri mesafeden hesaplar, doğrulama yapar (ışınlanma, sahipsiz top, saha
dışı) ve `CompiledScenario` üretir. Aksiyonlar: `hold, run, pass, longPass, dribble,
shoot, clear, press, seq, par, wait`.

## Kullanım (adım-adım)

Uygulama adım-merkezlidir: her senaryo adım adım oynar, adım bitince **otomatik durur**
ki direktif okunabilsin. **"Sonraki adım ▶"** ile ilerlenir, **"◀"** ile geri dönülür,
**"⟲ Baştan izle"** ile senaryonun tamamı kesintisiz oynatılır.

- Aktif adımın **koçluk notu** altta büyük ve okunur şekilde durur; sahada adım rozeti görünür.
- Varsayılan hız **0.75×** (yavaş, okunaklı); 0.5 / 0.75 / 1 seçilebilir.
- Klavye: `Space` oynat/durdur, `←/→` adım geç, `R` baştan.
- **?** düğmesi "Nasıl kullanılır?" yardımını açar (ilk açılışta otomatik gösterilir).
- **⬇** düğmesi senaryoyu **video (WebM)** olarak indirir — her karede adım başlığı +
  direktif gömülüdür, WhatsApp'tan takıma atılabilir.
- URL hash ile paylaşım: `#/senaryo/c1-ucuncu-adam` bir senaryoyu, `&t=2000` eklemek
  belirli bir anı açar.
