// Verify the mobile D-pad fix end-to-end
// (1) arrow keys are visible on mobile with inline SVG
// (2) wasd is hidden on mobile
// (3) D-pad buttons work: single tap moves one step
// (4) hold-to-repeat works
// (5) D-pad covers no maze tiles in portrait or landscape
const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

async function boot(page) {
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
  await page.click('#introNext'); await page.waitForTimeout(250);
  await page.click('#levelGrid .card:nth-child(2)'); await page.waitForTimeout(300);
  await page.click('#mapGrid .card:nth-child(1)'); await page.waitForTimeout(300);
  await page.click('#charStart'); await page.waitForTimeout(700);
  // instrument
  await page.evaluate(() => {
    window.__moves = [];
    const orig = window.movePlayer;
    window.movePlayer = function (dr, dc) { window.__moves.push([dr, dc]); return orig.apply(this, arguments); };
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = {};

  // ---- (1)(2): visible keys on mobile ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
    const r = await page.evaluate(() => {
      const byId = id => { const e = document.getElementById(id); if (!e) return 'MISSING'; const b = e.getBoundingClientRect(); return b.width > 0 ? `${Math.round(b.width)}x${Math.round(b.height)}` : 'hidden(0)'; };
      return {
        upBtn2: byId('upBtn2'),
        downBtn2: byId('downBtn2'),
        leftBtn2: byId('leftBtn2'),
        rightBtn2: byId('rightBtn2'),
        wasd_upBtn: byId('upBtn'),
        arrowsHaveSVG: document.querySelectorAll('.arrows .key svg').length,
        wasdHasSVG: document.querySelectorAll('.wasd .key svg').length,
      };
    });
    out.mobile_visibility = r;
    await ctx.close();
  }

  // ---- (3): single tap = single move ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    const b = await page.locator('#rightBtn2').boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(250);
    const moves = await page.evaluate(() => window.__moves);
    out.single_tap_moves = moves.length;
    out.single_tap_detail = moves;
    await ctx.close();
  }

  // ---- (4): hold-to-repeat ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    await page.evaluate(() => { window.__moves = []; });
    const b = await page.locator('#rightBtn2').boundingBox();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
    await page.waitForTimeout(850);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(250);
    const moves = await page.evaluate(() => window.__moves);
    out.hold_repeat_moves = moves.length;
    out.hold_repeat_detail = moves;
    await ctx.close();
  }

  // ---- (5): landscape D-pad does not overlap maze ----
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    const r = await page.evaluate(() => {
      const dpad = document.querySelector('.dpad');
      const canvas = document.getElementById('gameCanvas');
      if (!dpad || !canvas) return { dpad: 'MISSING', canvas: 'MISSING' };
      const db = dpad.getBoundingClientRect();
      const cb = canvas.getBoundingClientRect();
      const overlaps = db.left < cb.right && db.right > cb.left && db.top < cb.bottom && db.bottom > cb.top;
      return {
        dpad: `${Math.round(db.width)}x${Math.round(db.height)} @ (${Math.round(db.left)},${Math.round(db.top)})`,
        canvas: `${Math.round(cb.width)}x${Math.round(cb.height)}`,
        overlaps_canvas: overlaps,
        dpad_z: getComputedStyle(dpad).zIndex,
        qmodal_z: getComputedStyle(document.getElementById('qmodal')).zIndex,
      };
    });
    out.landscape_dpad = r;
    await ctx.close();
  }

  // ---- (5b): portrait D-pad placement ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    const r = await page.evaluate(() => {
      const dpad = document.querySelector('.dpad');
      const canvas = document.getElementById('gameCanvas');
      if (!dpad || !canvas) return { dpad: 'MISSING', canvas: 'MISSING' };
      const db = dpad.getBoundingClientRect();
      const cb = canvas.getBoundingClientRect();
      const overlaps = db.left < cb.right && db.right > cb.left && db.top < cb.bottom && db.bottom > cb.top;
      return {
        dpad: `${Math.round(db.width)}x${Math.round(db.height)} @ (${Math.round(db.left)},${Math.round(db.top)})`,
        canvas: `${Math.round(cb.width)}x${Math.round(cb.height)}`,
        overlaps_canvas: overlaps,
      };
    });
    out.portrait_dpad = r;
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
