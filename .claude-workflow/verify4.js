// Verify key visibility on mobile (portrait and landscape) — the core fix
const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = {};

  for (const [name, w, h] of [['portrait', 390, 844], ['landscape', 844, 390]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
    const r = await page.evaluate(() => {
      const byId = id => { const e = document.getElementById(id); if (!e) return 'MISSING'; const b = e.getBoundingClientRect(); return b.width > 0 ? `${Math.round(b.width)}x${Math.round(b.height)} @ (${Math.round(b.left)},${Math.round(b.top)})` : 'hidden'; };
      return {
        upBtn2: byId('upBtn2'),
        downBtn2: byId('downBtn2'),
        leftBtn2: byId('leftBtn2'),
        rightBtn2: byId('rightBtn2'),
        arrowsKeyClass: document.querySelectorAll('.arrows .key').length,
        arrowsSVG: document.querySelectorAll('.arrows .key svg').length,
        wasd_hidden: byId('upBtn'),
        dpadDisplay: getComputedStyle(document.querySelector('.dpad')).display,
        dpadPosition: getComputedStyle(document.querySelector('.dpad')).position,
        dpadLeft: getComputedStyle(document.querySelector('.dpad')).left,
        dpadTop: getComputedStyle(document.querySelector('.dpad')).top,
        controlsZ: getComputedStyle(document.querySelector('.controls')).zIndex,
        qmodalZ: getComputedStyle(document.getElementById('qmodal')).zIndex,
      };
    });
    out[name] = r;
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
