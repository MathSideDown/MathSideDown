// Screenshot the movement controls at each device size
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, 'shots2');

const DEVICES = [
  ['iphone13', 390, 844, 3],
  ['iphonese', 320, 568, 2],
  ['pixel5', 393, 851, 3],
  ['landscape', 844, 390, 3],
  ['ipad', 820, 1180, 2],
  ['desktop', 1440, 900, 1],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });
  for (const [name, w, h, dpr] of DEVICES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 900, hasTouch: w < 900 });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const rs = document.getElementById('rotateScreen'); if (rs) rs.classList.add('hidden'); });
    await page.click('#introNext'); await page.waitForTimeout(250);
    await page.click('#levelGrid .card:nth-child(2)'); await page.waitForTimeout(300);
    await page.click('#mapGrid .card:nth-child(1)'); await page.waitForTimeout(300);
    await page.click('#charStart'); await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    // crop of the bottom control area
    const ctl = await page.evaluate(() => {
      const c = document.querySelector('.controls').getBoundingClientRect();
      const d = document.querySelector('.dpad');
      const dr = d ? d.getBoundingClientRect() : null;
      return { x: 0, y: Math.round(c.top), width: window.innerWidth, height: Math.round(window.innerHeight - c.top),
               dpad: dr ? { x: Math.round(dr.left), y: Math.round(dr.top), width: Math.round(dr.width), height: Math.round(dr.height) } : null };
    });
    await page.screenshot({ path: path.join(OUT, name + '_controls.png'), clip: { x: ctl.x, y: ctl.y, width: ctl.width, height: ctl.height } });
    console.log(name, 'ok');
    await ctx.close();
  }
  await browser.close();
  console.log('shots in', OUT);
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
