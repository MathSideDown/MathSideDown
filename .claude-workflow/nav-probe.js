// Measures masthead internals to find who is eating the width, and whether
// each nav button is actually reachable inside the viewport.
// Run: node .claude-workflow/nav-probe.js
const { chromium } = require('playwright-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

const DEVICES = [
  { name: 'se-portrait', width: 320, height: 568, dpr: 2, mobile: true },
  { name: 'android-portrait', width: 360, height: 740, dpr: 3, mobile: true },
  { name: 'iphone14-portrait', width: 390, height: 844, dpr: 3, mobile: true },
  { name: 'iphone14-landscape', width: 844, height: 390, dpr: 3, mobile: true },
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  for (const d of DEVICES) {
    const ctx = await browser.newContext({
      viewport: { width: d.width, height: d.height },
      deviceScaleFactor: d.dpr, isMobile: d.mobile, hasTouch: d.mobile,
    });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const m = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) }; };
      const btns = [...document.querySelectorAll('.nav button')].map(b => {
        const r = b.getBoundingClientRect();
        return { nav: b.dataset.nav, l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), reachable: r.left >= 0 && r.right <= vw };
      });
      return {
        vw,
        masthead: box('.masthead'), logo: box('.logo'), logoMain: box('.logo-main'), nav: box('.nav'),
        btns,
        unreachable: btns.filter(b => !b.reachable).map(b => b.nav),
      };
    });

    console.log('=== ' + d.name + ' (' + d.width + 'px) ===');
    console.log('  masthead l=' + m.masthead.l + ' r=' + m.masthead.r + ' w=' + m.masthead.w);
    console.log('  logo w=' + m.logo.w + ' | logoMain w=' + m.logoMain.w + ' | nav l=' + m.nav.l + ' r=' + m.nav.r + ' w=' + m.nav.w);
    console.log('  nav buttons: ' + m.btns.map(b => b.nav + '[' + b.l + '-' + b.r + (b.reachable ? '' : ' CUT') + ']').join(' '));
    console.log('  UNREACHABLE: ' + (m.unreachable.length ? m.unreachable.join(', ') : 'none'));
    console.log('');
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
