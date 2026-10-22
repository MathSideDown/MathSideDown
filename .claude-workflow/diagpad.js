const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const dp = document.getElementById('dpad');
    const exists = !!document.getElementById('dpad');
    const cs = exists ? getComputedStyle(dp) : null;
    return { exists, display: cs && cs.display, position: cs && cs.position, zIndex: cs && cs.zIndex };
    return {
      exists: !!dp,
      display: cs.display,
      position: cs.position,
      zIndex: cs.zIndex,
      rect: exists ? dp.getBoundingClientRect().toJSON() : null,
      matchesLandscape: window.matchMedia('(max-width:900px) and (orientation:landscape)').matches,
      innerW: window.innerWidth, innerH: window.innerHeight,
    };
  });
  console.log(JSON.stringify(r, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
