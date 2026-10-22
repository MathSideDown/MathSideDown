const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
  await page.click('#introNext'); await page.waitForTimeout(300);
  await page.click('#levelGrid .card:nth-child(2)'); await page.waitForTimeout(350);
  await page.click('#mapGrid .card:nth-child(1)'); await page.waitForTimeout(350);
  await page.click('#charStart'); await page.waitForTimeout(800);

  const probe = await page.evaluate(() => {
    const g = s => document.querySelector(s);
    const info = (s) => {
      const e = g(s); if (!e) return 'MISSING';
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      return { display: cs.display, position: cs.position, zIndex: cs.zIndex, overflow: cs.overflow,
               w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left),
               color: cs.color, fontSize: cs.fontSize, bg: cs.backgroundColor, border: cs.borderTopWidth + ' ' + cs.borderTopColor };
    };
    const out = {};
    ['.side', '.rift', '.rift-idle', '.rift-idle p', '.qmodal', '.controls', '.ctl', '.keys.wasd', '.keys.arrows',
     '.stats', '.layout', '.stage', '.qtext.ghosted', '.qmeta'].forEach(s => { out[s] = info(s); });

    // what text is actually painting in the lower-left of the viewport?
    const stray = [];
    document.querySelectorAll('.side *').forEach(e => {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      if (cs.display !== 'none' && r.height > 0 && r.top > 500 && r.top < 844) {
        stray.push({ sel: e.className || e.tagName, text: (e.textContent || '').trim().slice(0, 40), top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), display: cs.display });
      }
    });
    out._strayTextInFooterBand = stray;

    // does the rift-idle show?
    const ri = g('.rift-idle');
    out._riftIdleText = ri ? ri.textContent.trim() : null;

    // font-family actually applied to keys
    out._keyFont = g('.key') ? getComputedStyle(g('.key')).fontFamily : null;
    out._bodyFont = getComputedStyle(document.body).fontFamily;
    out._rootVars = (() => { const cs = getComputedStyle(document.documentElement); return ['--red','--line','--glow','--panel2','--muted','--text'].map(v => v + '=' + cs.getPropertyValue(v).trim()).join(' '); })();
    return out;
  });
  console.log(JSON.stringify(probe, null, 2));

  // ---- tap test: does one tap move exactly one step? ----
  const tapTest = await page.evaluate(async () => {
    const before = { r: null, c: null };
    // player is a module-level let; read via the canvas? expose through closure isn't possible.
    // Instead: count how many times movePlayer runs by patching nothing — use keydown count proxy.
    return 'n/a';
  });

  // ---- tap a WASD key and observe score/position change via DOM-free probe ----
  const posBefore = await page.evaluate(() => {
    const c = document.getElementById('gameCanvas');
    return c ? c.width + 'x' + c.height : null;
  });

  // Real tap test with touchscreen
  await page.touchscreen.tap(100, 780).catch(e => console.log('tap err', e.message));
  await page.waitForTimeout(300);
  const afterTap = await page.evaluate(() => {
    // read maze render state indirectly: count via a MutationObserver-free approach
    return document.getElementById('score').textContent;
  });
  console.log('score after tap:', afterTap, 'canvas', posBefore);

  await browser.close();
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
