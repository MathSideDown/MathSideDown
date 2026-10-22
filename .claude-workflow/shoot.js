// Screenshot harness for MathSide Down — renders the site at real device sizes
// and exercises the movement controls. Run: node .claude-workflow/shoot.js [outDir]
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, process.argv[2] || 'shots');
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
    await page.waitForTimeout(600);

    // --- boot the game through the real UI: intro -> level -> map -> char -> play ---
    await page.evaluate(() => {
      const rs = document.getElementById('rotateScreen');
      if (rs) rs.classList.add('hidden');
    });
    await page.click('#introNext').catch(() => {});
    await page.waitForTimeout(350);
    await page.click('#levelGrid .card:nth-child(2)').catch(() => {});
    await page.waitForTimeout(400);
    await page.click('#mapGrid .card:nth-child(1)').catch(() => {});
    await page.waitForTimeout(400);
    await page.click('#charStart').catch(() => {});
    await page.waitForTimeout(900);

    // --- measure the real layout ---
    const metrics = await page.evaluate(() => {
      const q = s => document.querySelector(s);
      const box = s => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), display: getComputedStyle(e).display, visibility: getComputedStyle(e).visibility }; };
      const all = s => Array.from(document.querySelectorAll(s)).map(e => {
        const r = e.getBoundingClientRect();
        return { id: e.id, cls: e.className, w: Math.round(r.width), h: Math.round(r.height), display: getComputedStyle(e).display, visible: r.width > 0 && r.height > 0 };
      });
      const c = q('#gameCanvas');
      const cr = c ? c.getBoundingClientRect() : null;
      const dpr = window.devicePixelRatio || 1;
      const cols = 29, rows = 15;
      const ts = cr ? Math.floor(Math.min(cr.width / cols, cr.height / rows)) : 0;
      return {
        doc: { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, scrollH: document.documentElement.scrollHeight, clientH: document.documentElement.clientHeight },
        stage: box('.stage'), controls: box('.controls'), ctl: box('.ctl'), masthead: box('.masthead'), stats: box('.stats'), layout: box('.layout'),
        canvas: cr ? { w: Math.round(cr.width), h: Math.round(cr.height), top: Math.round(cr.top), bottom: Math.round(cr.bottom) } : null,
        tileSize: ts,
        mazeW: ts * cols, mazeH: ts * rows,
        deadLeft: cr ? Math.round((cr.width - ts * cols) / 2) : 0,
        deadTop: cr ? Math.round((cr.height - ts * rows) / 2) : 0,
        wasdKeys: all('.keys.wasd .key'), arrowKeys: all('.keys.arrows .key'),
        actionBtn: box('#actionBtn'), pauseBtn: box('#pauseBtn'), quitBtn: box('#quitGameBtn'),
        mini: all('.mini'),
      };
    });

    await page.screenshot({ path: path.join(OUT, d.name + '-play.png') });

    // --- measure an individual arrow key's tap target ---
    const arrowTap = await page.evaluate(() => {
      const out = {};
      ['upBtn2', 'downBtn2', 'leftBtn2', 'rightBtn2', 'upBtn', 'leftBtn'].forEach(id => {
        const e = document.getElementById(id);
        if (!e) { out[id] = null; return; }
        const r = e.getBoundingClientRect();
        out[id] = { w: Math.round(r.width), h: Math.round(r.height), display: getComputedStyle(e).display, aria: e.getAttribute('aria-label'), text: (e.textContent || '').trim() };
      });
      return out;
    });

    // --- does tapping an arrow actually move the player exactly one step? ---
    const moveTest = await page.evaluate(() => {
      const p = window.player || null;
      return p ? { r: p.r, c: p.c } : null;
    });

    // --- question modal: does the D-pad stay tappable / does the modal win? ---
    await page.evaluate(() => { const m = document.getElementById('qmodal'); if (m) m.classList.remove('hidden'); });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, d.name + '-question.png') });
    const modalState = await page.evaluate(() => {
      const m = document.getElementById('qmodal');
      const c = document.querySelector('.controls');
      const r = c ? c.getBoundingClientRect() : null;
      const el = document.elementFromPoint(r ? r.left + r.width / 2 : 0, r ? r.top + r.height / 2 : 0);
      return {
        qmodalZ: m ? getComputedStyle(m).zIndex : null,
        controlsZ: c ? getComputedStyle(c).zIndex : null,
        topElementAtControlsCenter: el ? (el.id || el.className || el.tagName) : null,
      };
    });
    await page.evaluate(() => { const m = document.getElementById('qmodal'); if (m) m.classList.add('hidden'); });

    // --- intro screen (first impression) ---
    await page.evaluate(() => { const s = document.getElementById('introScreen'); if (s) s.classList.remove('hidden'); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, d.name + '-intro.png') });

    report.push({ device: d.name, size: d.width + 'x' + d.height, metrics, arrowTap, moveTest, modalState, errors });
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
