// Verify: (1) .rift-idle specificity bug on mobile, (2) arrow glyph font fallback
const { chromium } = require('playwright-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const out = {};

  // ---- (1) .rift-idle: does the mobile display:none actually apply? ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const ri = document.querySelector('.rift-idle');
      const qm = document.getElementById('qmodal');
      // which rule wins? list matched CSS rules
      const matched = [];
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
        for (const rule of rules) {
          if (!rule.selectorText) continue;
          if (rule.selectorText.includes('rift-idle')) {
            matched.push({ sel: rule.selectorText, css: rule.style.cssText, media: rule.parentRule ? rule.parentRule.conditionText : null });
          }
        }
      }
      return {
        computedDisplay: getComputedStyle(ri).display,
        height: ri.getBoundingClientRect().height,
        qmodalHasHidden: qm.classList.contains('hidden'),
        rules: matched,
      };
    });
    out.riftIdle = r;
    await ctx.close();
  }

  // ---- (2) arrow glyph font fallback: do the 4 glyphs come from ONE font? ----
  {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200); // let webfonts load
    const r = await page.evaluate(async () => {
      await document.fonts.ready;
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;font-size:100px;white-space:pre;';
      document.body.appendChild(probe);
      const widthOf = (txt, font) => { probe.style.font = font; probe.textContent = txt; return probe.getBoundingClientRect().width; };
      const loaded = "'Share Tech Mono'";
      const glyphs = { up: '▲', left: '◀', down: '▼', right: '▶' };
      const res = {};
      for (const [k, g] of Object.entries(glyphs)) {
        const wLoaded = widthOf(g, '100px ' + loaded);
        const wMono = widthOf(g, '100px monospace');
        const wSans = widthOf(g, '100px sans-serif');
        // If the glyph were missing from the loaded font, widths would match a fallback exactly
        res[k] = { wLoaded: Math.round(wLoaded * 100) / 100, wMono: Math.round(wMono * 100) / 100, wSans: Math.round(wSans * 100) / 100,
                   fallsBackToMono: Math.abs(wLoaded - wMono) < 0.5, fallsBackToSans: Math.abs(wLoaded - wSans) < 0.5 };
      }
      // Also check the exact codepoints are absent from the loaded font using canvas measure against a known-missing glyph
      const wMissing = widthOf('\u{1F600}', '100px ' + loaded); // emoji, definitely missing
      res._emojiWidthAsMissingProbe = Math.round(wMissing * 100) / 100;
      probe.remove();
      return res;
    });
    out.fontFallback = r;
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
