// Verify the REAL question flow locks the pads (not a manual class removal)
const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = {};
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
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

  out.before = await page.evaluate(() => ({
    padLocked: document.querySelector('.arrows').classList.contains('locked'),
    dpadLocked: document.getElementById('dpad').classList.contains('locked'),
    qmodalHidden: document.getElementById('qmodal').classList.contains('hidden'),
  }));

  // Walk the player onto a math rift so a REAL question opens.
  // Use the exposed maze via a scripted movePlayer call on a known 'M' tile.
  await page.evaluate(() => {
    // find an M tile in the current maze and teleport the player there
    const g = window; // maze/player are module-scope, not on window
    return null;
  });

  // Instead: call handleStation directly the way movePlayer does.
  await page.evaluate(() => {
    // movePlayer is on window; find an 'M' by probing moves is fiddly.
    // Use the game's own path: the first map's math rift is at row 1, col 5.
  });

  // Walk right from the start (row 1, col 1) to col 6 -> that is 'M' in 'hawkins'
  for (let i = 0; i < 5; i++) {
    const b = await page.locator('#rightBtn2').boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(500);

  out.afterWalking = await page.evaluate(() => ({
    padLocked: document.querySelector('.arrows').classList.contains('locked'),
    dpadLocked: document.getElementById('dpad').classList.contains('locked'),
    qmodalHidden: document.getElementById('qmodal').classList.contains('hidden'),
    qtext: document.getElementById('qtext').textContent,
    moves: window.__moves.length,
  }));

  // Tapping the pad during the question must NOT move the player.
  const b = await page.locator('#rightBtn2').boundingBox();
  const before = (await page.evaluate(() => window.__moves)).length;
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(250);
  const after = (await page.evaluate(() => window.__moves)).length;
  out.tapDuringQuestion = { before, after, blocked: before === after };

  // Answer the question and confirm the pad unlocks.
  await page.click('#qopts .qopt'); await page.waitForTimeout(500);
  out.afterAnswer = await page.evaluate(() => ({
    padLocked: document.querySelector('.arrows').classList.contains('locked'),
    dpadLocked: document.getElementById('dpad').classList.contains('locked'),
    qmodalHidden: document.getElementById('qmodal').classList.contains('hidden'),
  }));

  // And the pad works again after unlocking.
  const b2 = await page.locator('#rightBtn2').boundingBox();
  const m1 = (await page.evaluate(() => window.__moves)).length;
  await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2);
  await page.waitForTimeout(250);
  const m2 = (await page.evaluate(() => window.__moves)).length;
  out.movesAfterUnlock = { m1, m2, works: m2 > m1 };

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
