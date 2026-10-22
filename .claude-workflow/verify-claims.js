// Verify specific claims from the audits before implementing them.
const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = {};

  // --- CLAIM 1: does a touch on the footer while state==='intro' skip the intro? ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
    const before = await page.evaluate(() => ({
      introVisible: !document.getElementById('introScreen').classList.contains('hidden'),
      levelVisible: !document.getElementById('levelScreen').classList.contains('hidden'),
    }));
    // tap the WASD 'right' button (footer) on the intro screen
    const b = await page.locator('#rightBtn').boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({
      introVisible: !document.getElementById('introScreen').classList.contains('hidden'),
      levelVisible: !document.getElementById('levelScreen').classList.contains('hidden'),
    }));
    out.claim1_introTouchSkipsIntro = { before, after, skipped: before.introVisible && after.levelVisible };
    await ctx.close();
  }

  // --- CLAIM 2: does :active apply on a touchstart-preventDefault'd button? ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    // Does :active match during a touch hold in Chrome (mobile emulation)?
    const res = await page.evaluate(() => new Promise(resolve => {
      const btn = document.getElementById('rightBtn');
      let activeSeen = false;
      const obs = new MutationObserver(() => {});
      const check = () => { if (btn.matches(':active')) activeSeen = true; };
      const iv = setInterval(check, 16);
      const r = btn.getBoundingClientRect();
      const opts = { bubbles: true, cancelable: true };
      const t = new Touch({ identifier: 1, target: btn, clientX: r.left + 5, clientY: r.top + 5 });
      btn.dispatchEvent(new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true }));
      setTimeout(() => {
        btn.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [], changedTouches: [t], bubbles: true, cancelable: true }));
        clearInterval(iv); resolve({ activeSeenDuringHold: activeSeen });
      }, 300);
    }));
    out.claim2_activeMatchesDuringTouchHold = res;
    await ctx.close();
  }

  // --- CLAIM 3: does the mobile qmodal (z-index 80) really get covered by .controls (z-index 100)? ---
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
    const r = await page.evaluate(() => {
      const ids = ['rightBtn', 'rightBtn2', 'actionBtn', 'quitGameBtn', 'pauseBtn'];
      const res = {};
      ids.forEach(id => {
        const e = document.getElementById(id); if (!e) { res[id] = 'missing'; return; }
        const b = e.getBoundingClientRect(); if (!b.width) { res[id] = 'hidden'; return; }
        const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        res[id] = top ? (top.id || top.className || top.tagName) : 'null';
      });
      // Is the footer visually on top of the modal overlay?
      const c = document.querySelector('.controls');
      const q = document.getElementById('qmodal');
      res._controlsZ = getComputedStyle(c).zIndex;
      res._qmodalZ = getComputedStyle(q).zIndex;
      return res;
    });
    out.claim3_modalVsFooterHitTest = r;
    await ctx.close();
  }

  // --- CLAIM 4: does keydown on arrow keys scroll the page? ---
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
    await page.click('#introNext'); await page.waitForTimeout(250);
    await page.click('#levelGrid .card:nth-child(2)'); await page.waitForTimeout(300);
    await page.click('#mapGrid .card:nth-child(2)'); await page.waitForTimeout(300);
    await page.click('#charStart'); await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const before = window.scrollY;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
      return { scrollY: before, defaultPrevented: false, bodyOverflow: getComputedStyle(document.body).overflow, htmlOverflow: getComputedStyle(document.documentElement).overflow };
    });
    out.claim4_arrowKeyScroll = r;
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
