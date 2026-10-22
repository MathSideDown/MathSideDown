// Full regression test for the mobile D-pad work
const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

async function boot(page, mapIdx = 1) {
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
  await page.click('#introNext'); await page.waitForTimeout(250);
  await page.click('#levelGrid .card:nth-child(2)'); await page.waitForTimeout(300);
  await page.click(`#mapGrid .card:nth-child(${mapIdx})`); await page.waitForTimeout(300);
  await page.click('#charStart'); await page.waitForTimeout(700);
  await page.evaluate(() => {
    window.__moves = [];
    const orig = window.movePlayer;
    window.movePlayer = function (dr, dc) { window.__moves.push([dr, dc]); return orig.apply(this, arguments); };
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const R = {};
  const pass = [], fail = [];
  const check = (name, ok, detail) => (ok ? pass : fail).push(name + (detail ? ' :: ' + JSON.stringify(detail) : ''));

  // --- A. desktop is unchanged: WASD + arrows both visible ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const vis = id => { const e = document.getElementById(id); return e && e.getBoundingClientRect().width > 0; };
      return { wasd: vis('upBtn'), arrows: vis('upBtn2'), wasdText: document.getElementById('upBtn').textContent, dpad: getComputedStyle(document.querySelector('.dpad')).display };
    });
    check('A desktop: WASD visible', r.wasd);
    check('A desktop: arrows visible', r.arrows);
    check('A desktop: WASD shows letter', r.wasdText.trim() === 'W', r.wasdText);
    check('A desktop: overlay dpad hidden', r.dpad === 'none');
    await ctx.close();
  }

  // --- B. mobile portrait: arrow pad visible, WASD hidden ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const vis = id => { const e = document.getElementById(id); return e && e.getBoundingClientRect().width > 0; };
      const b = document.getElementById('rightBtn2').getBoundingClientRect();
      return { wasd: vis('upBtn'), arrows: vis('rightBtn2'), size: `${Math.round(b.width)}x${Math.round(b.height)}`,
               svg: document.querySelectorAll('.arrows .key svg').length,
               glyph: document.getElementById('rightBtn2').textContent.trim(),
               riftIdle: getComputedStyle(document.querySelector('.rift-idle')).display };
    });
    check('B mobile: arrows visible', r.arrows);
    check('B mobile: WASD hidden', !r.wasd);
    check('B mobile: touch target >= 44px', r.size === '46x46' || r.size === '48x48', r.size);
    check('B mobile: 4 inline SVGs', r.svg === 4);
    check('B mobile: no unicode glyph text', r.glyph === '', JSON.stringify(r.glyph));
    check('B mobile: rift-idle not bleeding', r.riftIdle === 'none', r.riftIdle);
    await ctx.close();
  }

  // --- C. single tap = exactly one move (no double-fire) ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    const b = await page.locator('#rightBtn2').boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(250);
    const n = (await page.evaluate(() => window.__moves)).length;
    check('C single tap = 1 move', n === 1, n);
    await ctx.close();
  }

  // --- D. hold = repeat ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    const b = await page.locator('#rightBtn2').boundingBox();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
    await page.waitForTimeout(900);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(250);
    const n = (await page.evaluate(() => window.__moves)).length;
    check('D hold 900ms repeats (>=3)', n >= 3, n);
    await ctx.close();
  }

  // --- E. repeat stops on release (no runaway) ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    const b = await page.locator('#rightBtn2').boundingBox();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
    await page.waitForTimeout(600);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(300);
    const afterRelease = (await page.evaluate(() => window.__moves)).length;
    await page.waitForTimeout(700);
    const later = (await page.evaluate(() => window.__moves)).length;
    check('E repeat stops on release', afterRelease === later, { afterRelease, later });
    await ctx.close();
  }

  // --- F. landscape overlay D-pad works ---
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    const b = await page.locator('#padRight').boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(250);
    const mv = await page.evaluate(() => window.__moves);
    check('F landscape dpad moves right', mv.length === 1 && mv[0][0] === 0 && mv[0][1] === 1, mv);
    await ctx.close();
  }

  // --- G. during a REAL question, movement is blocked but pause/quit reachable ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    // Walk right onto the first math rift so a genuine question opens.
    for (let i = 0; i < 5; i++) {
      const b = await page.locator('#rightBtn2').boundingBox();
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(110);
    }
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const hit = id => { const e = document.getElementById(id); const b = e.getBoundingClientRect();
        const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return t ? (t.id || t.className) : 'none'; };
      const pad = document.querySelector('.arrows');
      return { questionOpen: !document.getElementById('qmodal').classList.contains('hidden'),
               pause: hit('actionBtn'), quit: hit('quitGameBtn'),
               padLocked: pad.classList.contains('locked'), padPointerEvents: getComputedStyle(pad).pointerEvents };
    });
    check('G a question is actually open', r.questionOpen === true, r.questionOpen);
    // The pad must be inert (pointer-events:none) so a stray tap can't move the player.
    check('G arrow pad is locked during question', r.padLocked === true, r.padLocked);
    check('G arrow pad ignores pointer events', r.padPointerEvents === 'none', r.padPointerEvents);
    check('G pause still reachable during question', r.pause === 'actionBtn', r.pause);
    check('G quit still reachable during question', r.quit === 'quitGameBtn', r.quit);
    await ctx.close();
  }

  // --- H. landscape dpad is inert during a real question ---
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await boot(page);
    for (let i = 0; i < 5; i++) {
      const b = await page.locator('#padRight').boundingBox();
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(110);
    }
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const dp = document.getElementById('dpad');
      return { questionOpen: !document.getElementById('qmodal').classList.contains('hidden'),
               locked: dp.classList.contains('locked'), pe: getComputedStyle(dp).pointerEvents };
    });
    check('H a question is actually open', r.questionOpen === true, r.questionOpen);
    check('H landscape dpad locked during question', r.locked === true, r);
    check('H landscape dpad ignores pointer events', r.pe === 'none', r.pe);
    await ctx.close();
  }

  // --- I. keyboard still works, and arrow keys don't scroll ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await boot(page);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100);
    const n = (await page.evaluate(() => window.__moves)).length;
    check('I keyboard arrow moves', n === 1, n);
    await page.keyboard.press('w'); await page.waitForTimeout(100);
    const n2 = (await page.evaluate(() => window.__moves)).length;
    check('I keyboard WASD moves', n2 === 2, n2);
    await ctx.close();
  }

  // --- J. keyboard activation of a focused button (a11y) ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await boot(page);
    await page.focus('#rightBtn2');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const mv = await page.evaluate(() => window.__moves);
    check('J keyboard Enter on focused arrow button moves', mv.length >= 1, mv);
    await ctx.close();
  }

  // --- K. no console errors on boot ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
    await boot(page);
    await page.evaluate(() => document.getElementById('qmodal').classList.remove('hidden'));
    await page.waitForTimeout(400);
    check('K no console errors', errs.length === 0, errs);
    await ctx.close();
  }

  // --- L. tapping a footer control on the intro screen must NOT skip the intro ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
    const b = await page.locator('#rightBtn2').boundingBox();
    if (b) {
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(300);
      const stillIntro = await page.evaluate(() => !document.getElementById('introScreen').classList.contains('hidden'));
      check('L footer tap does not skip intro', stillIntro);
    } else {
      check('L footer tap does not skip intro', false, 'arrow pad not measurable on intro screen');
    }
    await ctx.close();
  }

  await browser.close();
  console.log('\nPASS (' + pass.length + '):');
  pass.forEach(p => console.log('  OK  ' + p));
  if (fail.length) { console.log('\nFAIL (' + fail.length + '):'); fail.forEach(f => console.log('  XX  ' + f)); }
  console.log('\n' + (fail.length ? 'RESULT: ' + fail.length + ' FAILURES' : 'RESULT: ALL PASS'));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
