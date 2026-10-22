// Diagnose the 3 regressions
const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = {};

  // F: landscape dpad tap
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
    await page.click('#introNext'); await page.waitForTimeout(250);
    await page.click('#levelGrid .card:nth-child(2)'); await page.waitForTimeout(300);
    await page.click('#mapGrid .card:nth-child(1)'); await page.waitForTimeout(300);
    await page.click('#charStart'); await page.waitForTimeout(700);
    const b = await page.locator('#padRight').boundingBox();
    out.padRightBox = b;
    // what element is actually at that point?
    out.topAtPad = await page.evaluate(() => {
      const e = document.getElementById('padRight'); const r = e.getBoundingClientRect();
      const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return t ? { id: t.id, cls: t.className, tag: t.tagName } : 'none';
    });
    // is the dpad actually displayed?
    out.dpadInfo = await page.evaluate(() => {
      const d = document.querySelector('.dpad');
      const cs = getComputedStyle(d);
      const b = d.getBoundingClientRect();
      return { display: cs.display, z: cs.zIndex, pos: cs.position, l: b.left, t: b.top, w: b.width, h: b.height, vis: cs.visibility, op: cs.opacity };
    });
    // try a direct pointer event
    out.directTap = await page.evaluate(() => {
      const e = document.getElementById('padRight');
      const r = e.getBoundingClientRect();
      const opts = { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', clientX: r.left + 10, clientY: r.top + 10, isPrimary: true };
      e.dispatchEvent(new PointerEvent('pointerdown', opts));
      e.dispatchEvent(new PointerEvent('pointerup', opts));
      return 'dispatched';
    });
    await page.waitForTimeout(200);
    await ctx.close();
  }

  // G: qmodal vs arrow pad hit test
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
    await page.click('#introNext'); await page.waitForTimeout(250);
    await page.click('#levelGrid .card:nth-child(2)'); await page.waitForTimeout(300);
    await page.click('#mapGrid .card:nth-child(1)'); await page.waitForTimeout(300);
    await page.click('#charStart'); await page.waitForTimeout(700);
    await page.evaluate(() => document.getElementById('qmodal').classList.remove('hidden'));
    await page.waitForTimeout(200);
    out.g = await page.evaluate(() => {
      const q = document.getElementById('qmodal');
      const e = document.getElementById('rightBtn2');
      const r = e.getBoundingClientRect();
      const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const qb = q.getBoundingClientRect();
      return {
        qmodalRect: { l: Math.round(qb.left), t: Math.round(qb.top), w: Math.round(qb.width), h: Math.round(qb.height) },
        qmodalZ: getComputedStyle(q).zIndex,
        qmodalDisplay: getComputedStyle(q).display,
        qmodalParent: q.parentElement.className,
        controlsZ: getComputedStyle(document.querySelector('.controls')).zIndex,
        topAtArrow: t ? (t.id || t.className) : 'none',
        arrowRect: { l: Math.round(r.left), t: Math.round(r.top) },
        qmodalIsFixed: getComputedStyle(q).position,
      };
    });
    await ctx.close();
  }

  // L: intro screen footer tap
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
    const b = await page.locator('#rightBtn2').boundingBox();
    out.L_box = b;
    if (b) {
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(300);
      out.L_state = await page.evaluate(() => ({
        introVisible: !document.getElementById('introScreen').classList.contains('hidden'),
        levelVisible: !document.getElementById('levelScreen').classList.contains('hidden'),
        state: window.state,
      }));
    }
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
