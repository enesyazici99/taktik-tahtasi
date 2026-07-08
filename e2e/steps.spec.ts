import { expect, test } from '@playwright/test';

const SCENARIOS = [
  'h1-kanat-duvari', 'h2-gec-binen-8', 'h3-arka-direk', 'h4-taraf-degistirme', 'h5-kontra',
  'p1-aut-presi', 'p2-pres-tetikleri', 'p3-pres-kirilirsa',
  'c1-ucuncu-adam', 'c2-kaleci-switch', 'c3-uzun-top',
  's1-blok-kaymasi', 's2-kanat-savunmasi', 's3-libero',
  'g1-karsi-pres', 'g2-kazanim-karari',
];

// Yardım ekranını atla (localStorage) — her testte temiz bağlam.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tt-help-seen', '1'));
});

for (const id of SCENARIOS) {
  test(`adımlar sırayla ilerler ve animasyon oynar: ${id}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    await page.goto(`#/senaryo/${id}`);
    const badge = page.locator('.step-badge');
    await expect(badge).toBeVisible();

    const total = await page.locator('.phase-pill').count();
    expect(total).toBeGreaterThanOrEqual(2);

    // 1. adımda başla
    await expect(badge).toHaveText(new RegExp(`^1/${total}`));

    // Animasyon gerçekten oynuyor mu? Tahtanın tamamı (oyuncular + top) zamanla
    // değişmeli (boşta kalanlar bile idle-sway ile kıpırdar).
    const snapshot = () =>
      page.$$eval('.player, .ball', (nodes) =>
        nodes.map((n) => n.getAttribute('transform')).join('|'),
      );
    const s0 = await snapshot();
    await page.waitForTimeout(900);
    const s1 = await snapshot();
    expect(s1, 'tahta hareket etmeli (animasyon)').not.toBe(s0);

    // Her "Sonraki adım" tam bir adım ilerletmeli (atlama yok)
    const next = page.locator('.stepbtn.next');
    for (let i = 1; i < total; i++) {
      await next.click();
      await expect(badge).toHaveText(new RegExp(`^${i + 1}/${total}`));
      await page.waitForTimeout(120);
    }

    // Son adımda "Baştan" → 1. adıma döner
    await expect(next).toContainText('Baştan');
    await next.click();
    await expect(badge).toHaveText(new RegExp(`^1/${total}`));

    expect(errors, errors.join('\n')).toEqual([]);
  });
}
