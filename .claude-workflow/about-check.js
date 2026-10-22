// Verifies the About screen renders without clipping at every target size.
// Run: node .claude-workflow/about-check.js [outDir]
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, process.argv[2] || 'about-shots');
fs.mkdirSync(OUT, { recursive: true });

const DEVICES = [
  { name: 'iphone14-portrait', width: 390, height: 844, dpr: 3, mobile: true },
  { name: 'android-portrait', width: 360, height: 740, dpr: 3, mobile: true },
  { name: 'se-portrait', width: 320, height: 568, dpr: 2, mobile: true },
  { name: 'iphone14-landscape', width: 844, height: 390, dpr: 3, mobile: true },
  { name: 'android-landscape', width: 740, height: 360, dpr: 3, mobile: true },
  { name: 'tablet-landscape', width: 1180, height: 820, dpr: 2, mobile: true },
  { name: 'desktop', width: 1440, height: 900, dpr: 1, mobile: false },
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const report = [];

  for (const d of DEVICES) {
    const ctx = await browser.newContext({
      viewport: { width: d.width, height: d.height },
      deviceScaleFactor: d.dpr,
      isMobile: d.mobile,
      hasTouch: d.mobile,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // open the About screen through the real nav button
    await page.evaluate(() => {
      const rs = document.getElementById('rotateScreen');
      if (rs) rs.classList.add('hidden');
    });
    await page.click('.nav button[data-nav="about"]').catch(() => {});
    await page.waitForTimeout(400);

    const m = await page.evaluate(() => {
      const about = document.getElementById('aboutScreen');
      const inner = document.querySelector('#aboutScreen .about');
      const ov = about.getBoundingClientRect();
      const inr = inner.getBoundingClientRect();
      const cs = getComputedStyle(about);
      const back = document.querySelector('#aboutScreen [data-back]');
      const br = back ? back.getBoundingClientRect() : null;

      // Content below the fold is FINE if the overlay actually scrolls to it.
      // Content above the fold is BROKEN if the overlay cannot scroll up to it.
      const canScroll = about.scrollHeight > about.clientHeight;
      const topClipped = inr.top < ov.top - 1;         // unreachable: no way to scroll up

      // after scrolling to the very bottom, is the Back button fully visible?
      about.scrollTop = about.scrollHeight;
      const ovAfter = about.getBoundingClientRect();
      const brAfter = back ? back.getBoundingClientRect() : null;
      const backReachable = brAfter
        ? (brAfter.bottom <= ovAfter.bottom + 1 && brAfter.top >= ovAfter.top - 1)
        : false;
      about.scrollTop = 0;

      return {
        visible: !about.classList.contains('hidden'),
        overlay: { w: Math.round(ov.width), h: Math.round(ov.height), scrollH: about.scrollHeight, clientH: about.clientHeight, overflowY: cs.overflowY },
        inner: { w: Math.round(inr.width), h: Math.round(inr.height) },
        canScroll,
        topClipped,
        backReachable,
        backBtn: br ? { w: Math.round(br.width), h: Math.round(br.height), visible: br.width > 0 && br.height > 0 } : null,
        // computed sizes that CSS specificity could have silently overridden
        computed: {
          sub: getComputedStyle(document.querySelector('.about-sub')).fontSize,
          lede: getComputedStyle(document.querySelector('.about-lede')).fontSize,
          tag: getComputedStyle(document.querySelector('.about-tag')).fontSize,
          h: getComputedStyle(document.querySelector('.about-h')).fontSize,
          crewName: getComputedStyle(document.querySelector('.crew .name')).fontSize,
        },
      };
    });

    await page.screenshot({ path: path.join(OUT, d.name + '-about.png') });

    // second shot: scrolled to the bottom, to prove the lower half is reachable
    await page.evaluate(() => {
      const a = document.getElementById('aboutScreen');
      a.scrollTop = a.scrollHeight;
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, d.name + '-about-bottom.png') });

    report.push({ device: d.name, size: d.width + 'x' + d.height, ...m, errors });
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'about-report.json'), JSON.stringify(report, null, 2));

  let bad = 0;
  for (const r of report) {
    const probs = [];
    if (!r.visible) probs.push('about screen did not open');
    if (r.topClipped) probs.push('top of content is unreachable (cannot scroll up)');
    if (!r.backReachable) probs.push('Back button not reachable after scrolling to bottom');
    if (r.backBtn && !r.backBtn.visible) probs.push('Back button has zero size');
    if (r.errors.length) probs.push('js errors: ' + r.errors.join(' | '));
    if (probs.length) { bad++; console.log('FAIL ' + r.device.padEnd(20) + probs.join('; ')); }
    else console.log('ok   ' + r.device.padEnd(20) + 'content=' + r.inner.h + 'px  view=' + r.overlay.clientH + 'px  ' + (r.canScroll ? 'scrolls' : 'fits'));
  }
  console.log(bad ? '\n' + bad + ' device(s) with problems' : '\nall devices clean');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
