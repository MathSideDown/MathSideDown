// Check exactly which maze tiles the landscape D-pad covers
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
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = {};
  for (const [name, w, h] of [['landscape844', 844, 390], ['landscape740', 740, 360], ['portrait390', 390, 844], ['portrait360', 360, 740], ['portrait320', 320, 568]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    try { await boot(page); } catch (e) { out[name] = { bootError: e.message.split('\n')[0] }; await ctx.close(); continue; }
    const r = await page.evaluate(() => {
      const canvas = document.getElementById('gameCanvas');
      const cb = canvas.getBoundingClientRect();
      const cols = 29, rows = 15;
      const ts = Math.floor(Math.min(cb.width / cols, cb.height / rows));
      const mazeW = cols * ts, mazeH = rows * ts;
      const offX = cb.left + (cb.width - mazeW) / 2;
      const offY = cb.top + (cb.height - mazeH) / 2;
      const maze = { l: Math.round(offX), r: Math.round(offX + mazeW), t: Math.round(offY), b: Math.round(offY + mazeH) };

      const dpad = document.querySelector('.dpad');
      const db = dpad.getBoundingClientRect();
      const dpadVisible = getComputedStyle(dpad).display !== 'none';
      const dp = { l: Math.round(db.left), r: Math.round(db.right), t: Math.round(db.top), b: Math.round(db.bottom) };

      // does the D-pad rectangle intersect the *maze* rectangle (not the canvas)?
      const hitsMaze = dpadVisible && dp.l < maze.r && dp.r > maze.l && dp.t < maze.b && dp.b > maze.t;

      // which stage metrics
      const stage = document.querySelector('.stage').getBoundingClientRect();
      return {
        tile: ts, maze, canvas: { l: Math.round(cb.left), r: Math.round(cb.right), w: Math.round(cb.width), h: Math.round(cb.height) },
        stage: { w: Math.round(stage.width), h: Math.round(stage.height) },
        dpadVisible, dpad: dp, hitsMaze,
        deadLeft: Math.round(maze.l - cb.left), deadRight: Math.round(cb.right - maze.r),
        deadTop: Math.round(maze.t - cb.top), deadBottom: Math.round(cb.bottom - maze.b),
        footerH: Math.round(document.querySelector('.controls').getBoundingClientRect().height),
        controlsOverflow: document.querySelector('.ctl').scrollWidth > document.querySelector('.ctl').clientWidth,
      };
    });
    out[name] = r;
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
