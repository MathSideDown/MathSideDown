// Why is the 320px footer 181px tall? Check .ctl wrapping.
const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = {};
  for (const [name, w, h] of [['p320', 320, 568], ['p360', 360, 740], ['p390', 390, 844], ['p430', 430, 932]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const ctl = document.querySelector('.ctl');
      const arrows = document.querySelector('.arrows');
      const kids = [...ctl.children].map(c => {
        const b = c.getBoundingClientRect();
        return { cls: c.className || c.id, x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), disp: getComputedStyle(c).display };
      });
      const ab = arrows.getBoundingClientRect();
      return {
        ctl: { w: Math.round(ctl.getBoundingClientRect().width), h: Math.round(ctl.getBoundingClientRect().height), scrollW: ctl.scrollWidth },
        arrowsBox: { x: Math.round(ab.left), y: Math.round(ab.top), w: Math.round(ab.width), h: Math.round(ab.height) },
        kids,
        footerH: Math.round(document.querySelector('.controls').getBoundingClientRect().height),
      };
    });
    out[name] = r;
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
