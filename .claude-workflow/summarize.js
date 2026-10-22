// Compact summary of a shoot.js report
const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, process.argv[2] || 'shots');
const rep = JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8'));

const pad = (s, n) => String(s).padEnd(n);
const num = n => (n === null || n === undefined) ? '-' : String(n);

console.log(pad('DEVICE', 22) + pad('SIZE', 11) + pad('stage', 7) + pad('ctlH', 6) + pad('tile', 5) + pad('deadX', 6) + pad('deadY', 6) + pad('ARROW', 12) + pad('WASD', 10) + pad('overflowX', 10) + 'qmodalZ');
console.log('-'.repeat(120));

for (const r of rep) {
  const m = r.metrics;
  const arrowVisible = m.arrowKeys.filter(k => k.visible).length;
  const wasdVisible = m.wasdKeys.filter(k => k.visible).length;
  const ovX = m.doc.scrollW > m.doc.clientW ? 'YES+' + (m.doc.scrollW - m.doc.clientW) : 'no';
  const ovY = m.doc.scrollH > m.doc.clientH ? 'YES+' + (m.doc.scrollH - m.doc.clientH) : 'no';
  console.log(
    pad(r.device, 22) + pad(r.size, 11) +
    pad(num(m.stage && m.stage.h), 7) +
    pad(num(m.controls && m.controls.h), 6) +
    pad(num(m.tileSize), 5) +
    pad(num(m.deadLeft), 6) +
    pad(num(m.deadTop), 6) +
    pad(arrowVisible + '/4  ' + num(r.arrowTap.upBtn2 && r.arrowTap.upBtn2.w) + 'px', 12) +
    pad(wasdVisible + '/4', 10) +
    pad(ovX, 10) +
    (r.modalState.qmodalZ + ' / ctl z' + r.modalState.controlsZ)
  );
}

console.log('\n--- per-device detail ---');
for (const r of rep) {
  const m = r.metrics;
  console.log('\n### ' + r.device + ' (' + r.size + ')');
  console.log('  masthead h=' + num(m.masthead && m.masthead.h) + '  layout h=' + num(m.layout && m.layout.h) + '  stats h=' + num(m.stats && m.stats.h) + '  stage h=' + num(m.stage && m.stage.h) + '  controls h=' + num(m.controls && m.controls.h));
  console.log('  canvas ' + num(m.canvas && m.canvas.w) + 'x' + num(m.canvas && m.canvas.h) + '  tile=' + num(m.tileSize) + 'px  maze=' + num(m.mazeW) + 'x' + num(m.mazeH) + '  deadL=' + num(m.deadLeft) + ' deadT=' + num(m.deadTop));
  console.log('  doc scrollW/clientW=' + m.doc.scrollW + '/' + m.doc.clientW + '  scrollH/clientH=' + m.doc.scrollH + '/' + m.doc.clientH);
  console.log('  arrow keys: ' + m.arrowKeys.map(k => k.id + '=' + k.w + 'x' + k.h + '(' + k.display + ')').join(' '));
  console.log('  wasd keys: ' + m.wasdKeys.map(k => k.id + '=' + k.w + 'x' + k.h + '(' + k.display + ')').join(' '));
  console.log('  actionBtn ' + num(m.actionBtn && m.actionBtn.w) + 'x' + num(m.actionBtn && m.actionBtn.h) + ' display=' + num(m.actionBtn && m.actionBtn.display) + ' | pauseBtn ' + num(m.pauseBtn && m.pauseBtn.w) + 'x' + num(m.pauseBtn && m.pauseBtn.h) + ' display=' + num(m.pauseBtn && m.pauseBtn.display) + ' | quit ' + num(m.quitBtn && m.quitBtn.w) + 'x' + num(m.quitBtn && m.quitBtn.h));
  console.log('  topElementAtControlsCenter=' + r.modalState.topElementAtControlsCenter + '   qmodalZ=' + r.modalState.qmodalZ + ' controlsZ=' + r.modalState.controlsZ);
  if (r.errors.length) console.log('  ERRORS: ' + r.errors.join(' | '));
}
