const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
  await page.click('#introNext'); await page.waitForTimeout(250);
  await page.click('#levelGrid .card:nth-child(2)'); await page.waitForTimeout(300);
  await page.click('#mapGrid .card:nth-child(1)'); await page.waitForTimeout(300);
  await page.click('#charStart'); await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const box = s => { const e = document.querySelector(s); if (!e) return 'MISSING'; const b = e.getBoundingClientRect();
      return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height), z: getComputedStyle(e).zIndex, pos: getComputedStyle(e).position }; };
    return { controls: box('.controls'), ctl: box('.ctl'), dpad: box('.dpad'), padRight: box('#padRight'), arrows: box('.arrows'), wasd: box('.wasd') };
  });
  console.log(JSON.stringify(r, null, 2));
  await browser.close();
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
