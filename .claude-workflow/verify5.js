// Verify the mobile D-pad fix end-to-end
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
  await page.evaluate(() => {
    window.__moves = [];
    const orig = window.movePlayer;
    window.movePlayer = function (dr, dc) { window.__moves.push([dr, dc]); return orig.apply(this, arguments); };
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = {};

  for (const [name, w, h, orientation] of [['portrait', 390, 844, 'portrait'], ['landscape', 844, 390, 'landscape']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    try {
      const r = await page.evaluate(() => {
        const byId = id => { const e = document.getElementById(id); if (!e) return 'MISSING'; const b = e.getBoundingClientRect(); return b.width > 0 ? `${Math.round(b.width)}x${Math.round(b.height)}` : 'hidden'; };
        return {
          upBtn2: byId('upBtn2'), downBtn2: byId('downBtn2'), leftBtn2: byId('leftBtn2'), rightBtn2: byId('rightBtn2'),
          wasdHidden: byId('upBtn'), arrowsCount: document.querySelectorAll('.arrows .key').length,
          arrowsSVG: document.querySelectorAll('.arrows .key svg').length,
          dpadDisplay: getComputedStyle(document.querySelector('.dpad')).display,
          dpadPosition: getComputedStyle(document.querySelector('.dpad')).position,
          controlsZ: getComputedStyle(document.querySelector('.controls')).zIndex,
          qmodalZ: getComputedStyle(document.getElementById('qmodal')).zIndex,
        };
      });
      out[name] = { visibility: r };
    } catch (e) { out[name] = { error: e.message }; }
    await ctx.close();
  }

  // single tap on arrow right button (mobile)
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

  // hold repeat on mobile
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

  // landscape D-pad placement and hit test
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    const r = await page.evaluate(() => {
      const dpad = document.querySelector('.dpad');
      const canvas = document.getElementById('gameCanvas');
      if (!dpad || !canvas) return { dpad: 'MISSING', canvas: 'MISSING' };
      const db = dpad.getBoundingClientRect(), cb = canvas.getBoundingClientRect();
      const overlaps = db.left < cb.right && db.right > cb.left && db.top < cb.bottom && db.bottom > cb.top;
      const padPos = { l: Math.round(db.left), t: Math.round(db.top), r: Math.round(db.right), b: Math.round(db.bottom), w: Math.round(db.width), h: Math.round(db.height) };
      return { overlaps_canvas: overlaps, ...padPos };
    });
    out.landscape_dpad = r;
    await ctx.close();
  }

  // keyboard arrow movement still works
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await boot(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    const moves = await page.evaluate(() => window.__moves);
    out.keyboard_arrow_moves = moves.length;
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
