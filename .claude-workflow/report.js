const { execSync } = require('child_process');
const fs = require('fs');
const raw = execSync('node .claude-workflow/verify6.js', { cwd: 'C:\\Users\\Admin\\Desktop\\MathSideDown', encoding: 'utf8' });
const d = JSON.parse(raw);
for (const [k, v] of Object.entries(d)) {
  if (v.bootError) { console.log(k, 'BOOT ERR', v.bootError); continue; }
  console.log(
    k.padEnd(14),
    'tile=' + String(v.tile).padEnd(3),
    'footerH=' + String(v.footerH).padEnd(4),
    'dpad=' + String(v.dpadVisible).padEnd(6),
    'hitsMaze=' + String(v.hitsMaze).padEnd(6),
    'overflow=' + String(v.controlsOverflow).padEnd(6),
    'deadL=' + String(v.deadLeft).padEnd(4),
    'stage=' + v.stage.w + 'x' + v.stage.h
  );
}
