// Input behaviour test: does one tap move exactly one step? Does hold-to-repeat work?
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
  // instrument movePlayer — top-level function declarations land on window
  await page.evaluate(() => {
    window.__moves = [];
    const orig = window.movePlayer;
    window.movePlayer = function (dr, dc) { window.__moves.push([dr, dc]); return orig.apply(this, arguments); };
  });
}
const moves = page => page.evaluate(() => window.__moves.slice());

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const results = {};

  // ---------- TOUCH: single tap ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    const box = await page.locator('#rightBtn2').boundingBox();
    console.log('rightBtn2 box (mobile):', JSON.stringify(box));
    // it's display:none on mobile today — use the WASD key that IS visible
    const b2 = await page.locator('#rightBtn').boundingBox();
    console.log('rightBtn (WASD) box (mobile):', JSON.stringify(b2));
    await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2);
    await page.waitForTimeout(250);
    results.touch_single_tap_moves = (await moves(page)).length;
    results.touch_single_tap_detail = await moves(page);

    // double tap fast
    await page.evaluate(() => { window.__moves = []; });
    await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2);
    await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2);
    await page.waitForTimeout(250);
    results.touch_double_tap_moves = (await moves(page)).length;

    // long press (hold) — currently should produce exactly 1 move
    await page.evaluate(() => { window.__moves = []; });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b2.x + b2.width / 2, y: b2.y + b2.height / 2 }] });
    await page.waitForTimeout(1200);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(250);
    results.touch_longpress_1_2s_moves = (await moves(page)).length;
    results.touch_longpress_detail = await moves(page);
    await ctx.close();
  }

  // ---------- MOUSE (desktop): single click + hold ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await boot(page);
    const b = await page.locator('#rightBtn2').boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(200);
    results.mouse_single_click_moves = (await moves(page)).length;

    await page.evaluate(() => { window.__moves = []; });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1200);
    await page.mouse.up();
    await page.waitForTimeout(200);
    results.mouse_hold_1_2s_moves = (await moves(page)).length;

    // keyboard path
    await page.evaluate(() => { window.__moves = []; });
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    results.keyboard_arrow_moves = (await moves(page)).length;
    results.keyboard_detail = await moves(page);
    await ctx.close();
  }

  // ---------- Does a D-pad press also trigger the canvas tap-to-move? ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    await page.evaluate(() => {
      window.__canvasMoves = 0;
      const c = document.getElementById('gameCanvas');
      c.addEventListener('touchend', () => { window.__canvasMoves++; }, true);
    });
    const b = await page.locator('#rightBtn').boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(250);
    results.canvas_touchend_after_dpad_tap = await page.evaluate(() => window.__canvasMoves);
    results.dpad_tap_move_count = (await moves(page)).length;
    await ctx.close();
  }

  // ---------- During a question: are movement buttons still tappable? ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    await page.evaluate(() => { document.getElementById('qmodal').classList.remove('hidden'); });
    await page.waitForTimeout(200);
    const hit = await page.evaluate(() => {
      const btns = ['rightBtn', 'rightBtn2', 'actionBtn', 'quitGameBtn'];
      const out = {};
      btns.forEach(id => {
        const e = document.getElementById(id); if (!e) { out[id] = 'missing'; return; }
        const r = e.getBoundingClientRect();
        if (r.width === 0) { out[id] = 'hidden'; return; }
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        out[id] = top ? (top.id || top.className || top.tagName) : 'none';
      });
      return out;
    });
    results.modal_hit_test = hit;
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
