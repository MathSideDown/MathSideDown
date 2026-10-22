// Diagnoses horizontal overflow at small widths, and isolates whether the
// About panel is the cause or whether the overflow is pre-existing chrome.
// Run: node .claude-workflow/about-width.js
const { chromium } = require('playwright-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

const DEVICES = [
  { name: 'se-portrait', width: 320, height: 568, dpr: 2, mobile: true },
  { name: 'android-portrait', width: 360, height: 740, dpr: 3, mobile: true },
  { name: 'iphone14-portrait', width: 390, height: 844, dpr: 3, mobile: true },
];

const probe = () => {
  const doc = document.documentElement;
  const over = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    if (r.right > doc.clientWidth + 1 || r.left < -1) {
      over.push({
        tag: el.tagName, cls: (el.className || '').toString().slice(0, 24), id: el.id || '',
        left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
        text: (el.textContent || '').trim().slice(0, 20),
      });
    }
  });
  return {
    scrollW: doc.scrollWidth, clientW: doc.clientWidth,
    bodyScrollW: document.body.scrollWidth,
    overflowing: over.slice(0, 12),
    overflowCount: over.length,
  };
};

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
    await page.evaluate(() => { const r = document.getElementById('rotateScreen'); if (r) r.classList.add('hidden'); });

    // 1) with About CLOSED — is the page already overflowing?
    const before = await page.evaluate(probe);

    // 2) open About WITHOUT any scrolling-by-click (call show() directly)
    await page.evaluate(() => { document.getElementById('aboutScreen').classList.remove('hidden'); });
    await page.waitForTimeout(250);
    const after = await page.evaluate(probe);

    // 3) is the About panel itself wider than the viewport?
    const panel = await page.evaluate(() => {
      const p = document.querySelector('#aboutScreen .about');
      const r = p.getBoundingClientRect();
      const lede = document.querySelector('.about-lede').getBoundingClientRect();
      const crew = document.querySelector('.crew li').getBoundingClientRect();
      return {
        panelW: Math.round(r.width), panelRight: Math.round(r.right),
        ledeRight: Math.round(lede.right), crewRight: Math.round(crew.right),
        viewport: document.documentElement.clientWidth,
      };
    });

    console.log('=== ' + d.name + ' (' + d.width + 'px) ===');
    console.log('  About closed : scrollW=' + before.scrollW + ' clientW=' + before.clientW +
      ' -> ' + (before.scrollW > before.clientW ? 'OVERFLOWS by ' + (before.scrollW - before.clientW) : 'fits') +
      ' (' + before.overflowCount + ' els)');
    if (before.overflowing.length) console.log('     ' + JSON.stringify(before.overflowing.slice(0, 4)));
    console.log('  About open   : scrollW=' + after.scrollW + ' clientW=' + after.clientW +
      ' -> ' + (after.scrollW > after.clientW ? 'OVERFLOWS by ' + (after.scrollW - after.clientW) : 'fits') +
      ' (' + after.overflowCount + ' els)');
    if (after.overflowing.length) console.log('     ' + JSON.stringify(after.overflowing.slice(0, 4)));
    console.log('  panel=' + panel.panelW + 'px right=' + panel.panelRight + ' | lede.right=' + panel.ledeRight + ' crew.right=' + panel.crewRight + ' | viewport=' + panel.viewport);
    console.log('');
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
