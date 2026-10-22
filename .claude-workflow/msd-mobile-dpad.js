export const meta = {
  name: 'msd-mobile-dpad',
  description: 'Design a highly visible, on-brand mobile movement control for MathSide Down',
  phases: [
    { title: 'Audit', detail: 'layout budget, visual language, touch input, accessibility audits' },
    { title: 'Design', detail: 'four independent proposals' },
    { title: 'Judge', detail: 'score and rank the proposals' },
    { title: 'Synthesize', detail: 'merge into one implementation spec' },
    { title: 'Verify', detail: 'ad-verify the spec' },
  ],
}

const DIR = 'C:\\Users\\Admin\\Desktop\\MathSideDown'
const CONTEXT = 'PROJECT: MathSide Down — a Stranger Things / Upside Down maze math game. Plain static site, no build step, no framework. FILES (READ-ONLY): ' + DIR + '\\index.html, ' + DIR + '\\style.css, ' + DIR + '\\script.js.'
const JL = function(o) { return JSON.stringify(o, null, 1) }

const AUDIT_SCHEMA = { type: 'object', additionalProperties: false, properties: { findings: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { id: { type: 'string' }, problem: { type: 'string' }, evidence: { type: 'string' }, impact: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'major', 'minor'] } }, required: ['id', 'problem', 'evidence', 'impact', 'severity'] } }, constraints: { type: 'array', items: { type: 'string' } }, recommendations: { type: 'array', items: { type: 'string' } } }, required: ['findings', 'constraints', 'recommendations'] };

const DESIGN_SCHEMA = { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, concept: { type: 'string' }, html: { type: 'string' }, css: { type: 'string' }, js: { type: 'string' }, breakpoints: { type: 'array', items: { type: 'string' } }, rationale: { type: 'string' }, risks: { type: 'array', items: { type: 'string' } }, a11y: { type: 'string' }, scores: { type: 'object', additionalProperties: false, properties: { visibility: { type: 'number' }, brand_fit: { type: 'number' }, robustness: { type: 'number' }, a11y: { type: 'number' }, diff_size: { type: 'number' } }, required: ['visibility', 'brand_fit', 'robustness', 'a11y', 'diff_size'] } }, required: ['name', 'concept', 'html', 'css', 'js', 'breakpoints', 'rationale', 'risks', 'a11y', 'scores'] };

const JUDGE_SCHEMA = { type: 'object', additionalProperties: false, properties: { ranking: { type: 'array', items: { type: 'string' } }, best: { type: 'string' }, rationale: { type: 'string' }, grafts: { type: 'array', items: { type: 'string' } } }, required: ['ranking', 'best', 'rationale', 'grafts'] };

const SPEC_SCHEMA = { type: 'object', additionalProperties: false, properties: { summary: { type: 'string' }, html: { type: 'string' }, css: { type: 'string' }, js: { type: 'string' }, media_queries: { type: 'array', items: { type: 'string' } }, visual_rationale: { type: 'string' }, pixel_budget: { type: 'string' }, a11y: { type: 'array', items: { type: 'string' } }, verification_steps: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'html', 'css', 'js', 'media_queries', 'visual_rationale', 'pixel_budget', 'a11y', 'verification_steps'] };

const VERDICT_SCHEMA = { type: 'object', additionalProperties: false, properties: { hole: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'major', 'minor'] }, detail: { type: 'string' }, fix: { type: 'string' } }, required: ['hole', 'severity', 'detail', 'fix'] };

const VERIFY_SCHEMA = { type: 'object', additionalProperties: false, properties: { holes: { type: 'array', items: VERDICT_SCHEMA } }, required: ['holes'] };

// ---------------- PHASE 1: AUDIT ----------------
phase('Audit')

const AUDITS = [
  {
    label: 'audit:layout',
    prompt: 'You are a mobile layout/pixel-budget auditor. ' + CONTEXT + '\n\nDeliver:\n1. Vertical pixel budget for devices: 390x844 portrait, 360x740 portrait, 320x568 portrait, 844x390 landscape, 740x360 landscape, 1180x820 tablet landscape. For each: px taken by masthead, layout padding+stats row, footer .controls, remaining px for .stage. Compute from actual css rules in style.css (read them; @media max-width:900px matters most).\n2. Current .stage height and resulting canvas tile size (tileSize = floor(min(rect.width/cols, rect.height/rows)), cols=29 rows=15) for 844x390 landscape and 390x844 portrait. Report dead space off each side.\n3. Every rule in style.css hiding/shrinking/crowding movement controls on mobile, with line numbers.\n4. Whether site is one-column at 1180px and 900px breakpoints and what footer looks like.\n5. Constraints: canvas must stay usable, overlays must cover canvas, qmodal z-index:80 must win over footer z-index:100 on question-open, viewport-fit=cover in meta viewport.\n\nBe precise and quantitative. Read the files first.',
  },
  {
    label: 'audit:visual',
    prompt: 'You are a visual-design-system analyst. ' + CONTEXT + '\n\nRead C:\Users\Admin\Desktop\MathSideDown\\style.css fully and C:\Users\Admin\Desktop\MathSideDown\\index.html.\n\nDeliver:\n1. Inventory of recurring visual motifs: corner brackets (implementation, where), border treatments, glow values, gradients, scanline overlay, vignette, border-radius usage, accent colour system, uppercase+letter-spacing, display fonts deployed.\n2. EXACT visual recipe of what makes a new control native: colours, gradients, shadows, borders, fonts, focus-visible rule EXACT values, text-transform, letter-spacing.\n3. Three distinct styling directions for a mobile D-pad staying on-brand — exact CSS (hex, rgba, px) AND plain description. Each harmonises with .panel/.masthead. Say which LOOK WRONG.\n4. Contrast of proposed colors against backgrounds: --red #ff2a3d on #05030a; --red on --panel2 #14080e; lighter red on dark; --cyan #00f0ff on #05030a; --text on #160610; --muted on #05030a. Ratios and WCAG AA levels (AA 4.5:1 text, 3:1 UI components 1.4.11). Identify EVERY pair failing 3:1 and fix.\n5. Whether W/A/S/D pad and arrow pad should coexist on desktop and how they look today. Give hexes and rgbaes. Do not describe vaguely.',
  },
  {
    label: 'audit:input',
    prompt: 'You are a touch-input engineer. ' + CONTEXT + '\n\nRead C:\Users\Admin\Desktop\MathSideDown\\script.js fully (bindTap, bindDir, handleDir, movePlayer, canvas swipe/tap handlers) and HTML.\n\nDeliver:\n1. Does a tap on a movement button move exactly one step on iOS Safari and Chrome Android? Explain click+touchstart double-binding and whether preventDefault on touchstart suppresses synthesized click on each platform. Cite code.\n2. Hold-to-repeat design: initial delay, repeat interval, start/stop, cancel on touchend/touchcancel/touchleave, guard against firing while question modal open or game paused, leak past gameOver(), exact JS.\n3. Mouse vs touch: should press-and-hold repeat on desktop too? Implement mouse without breaking keyboard path.\n4. Conflict with canvas swipe/tap-to-move: could a D-press also trigger canvas tap? DOM containment (footer outside section.stage), event bubbling, -webkit-tap-highlight-color.\n5. Accessibility: aria-labels needed on arrow glyphs; glyphs screen reader announce inconsistently; WASD buttons hidden from AT if visually hidden.\n6. safe-area-insets: apply env(safe-area-inset-bottom) to footer with fallback; viewport meta viewport-fit=cover.\n7. Other mobile input bugs exposed by the change. Give exact code, not prose descriptions.',
  },
  {
    label: 'audit:a11y',
    prompt: 'You are an accessibility specialist. ' + CONTEXT + '\n\nRead C:\Users\Admin\Desktop\MathSideDown\\style.css and C:\Users\Admin\Desktop\MathSideDown\\index.html.\n\nDeliver:\n1. WCAG contrast (relative luminance formula, show math) for proposed control colours vs backgrounds: --red #ff2a3d on #05030a; --red on #14080e; #ff6b78 on #160610; --cyan #00f0ff on #05030a; --text on #160610; --muted on #05030a. Ratios and WCAG AA levels (AA 4.5:1 text, 3:1 UI components 1.4.11). Identify EVERY pair failing 3:1 and fix.\n2. Target size min 24x24 CSS px (WCAG 2.5.8) — verify design exceeds it.\n3. Focus-visibility: existing .nav button:focus-visible,.key:focus-visible,.mini:focus-visible,.btn:focus-visible outline 2px solid var(--cyan) outline-offset 2px — verify new class added or change specified.\n4. aria semantics: plain buttons labelled group vs single role=group toolbar. Recommend simplest correct markup. Arrow glyphs need aria-labels. display:none removes from AT tree for hidden WASD pad.\n5. prefers-reduced-motion block: does D-pad need press animation? What degrades?\n6. D-pad legibility over the canvas behind it: worst case floor colour (#18100f etc.) — opaque fill vs backdrop needed?\nGive exact numbers and exact CSS/markup.',
  },
]

const audits = (await parallel(AUDITS.map(function(a) { return function() { return agent(a.prompt, { label: a.label, phase: 'Audit', schema: AUDIT_SCHEMA })() } }))).filter(Boolean)
log((audits.length) + '/4 audits complete')

const AUDIT_DIGEST = audits.map(JL).join('\n\n')

// ---------------- PHASE 2: DESIGN ----------------
phase('Design')

const BRIEFS = [
  { label: 'design:ergonomics', brief: 'OPTIMISE FOR ERGONOMICS FIRST. Thumb reach, minimum tap targets, hold-to-repeat, no accidental double-moves, safe-area insets, landscape vs portrait. Aesthetics second priority.' },
  { label: 'design:visual', brief: 'OPTIMISE FOR VISUAL COHESION FIRST. Must look native to this Stranger Things / Upside Down system — sharp neon-red console aesthetic, corner brackets, existing gradients/glows, custom properties. Must be MORE VISIBLE than today. Ergonomics second.' },
  { label: 'design:minimal', brief: 'OPTIMISE FOR MINIMAL LOW-RISK CHANGE FIRST. Smallest possible diff to style.css/index.html/script.js. Reuse existing classes and motifs. Preserve desktop layout. Mobile-only where possible.' },
  { label: 'design:robust', brief: 'OPTIMISE FOR ROBUSTNESS ACROSS DEVICES FIRST. No overflow at 320px, no maze eaten, no overlap with question modal, degrades sanely at every size. Aesthetics and minimal-diff second.' },
]

const designs = (await parallel(BRIEFS.map(function(b) { return function() { return agent((CONTEXT + '\n\nYOUR BRIEF: ' + b.brief + '\n\nRead the actual source files so every id, class, selector is REAL. Do not invent selectors. Produce a proposal with name, concept, html (exact final footer), css (exact final rules), js (exact final input functions), breakpoints, rationale, risks, a11y, scores 1-10 each. Be exact and complete.') , { label: b.label, phase: 'Design', schema: DESIGN_SCHEMA })() } }))).filter(Boolean)
log((designs.length) + '/4 designs complete')

const DESIGN_DIGEST = designs.map(JL).join('\n\n----\n\n')

// ---------------- PHASE 3: JUDGE ----------------
phase('Judge')

const LENSES = [
  { key: 'ergonomics', ask: 'Can this be used well with a thumb on a phone in landscape while the maze is also visible? Are tap targets big enough? Does hold-to-repeat behave correctly? Does it fight with swipe/tap-to-move?' },
  { key: 'brand', ask: 'Does this look like it belongs to THIS site? Would a Stranger Things designer sign off? Does it clash with the panel/console aesthetic? Is it actually MORE VISIBLE than today? Ergonomics second, aesthetics first.' },
  { key: 'robustness', ask: 'Will this break at 320px wide, 360px tall landscape, tablet, when question modal opens? Layout overflow, z-index, event bubbling hazards? Is the JS airtight?' },
  { key: 'a11y', ask: 'Does it meet contrast, target-size, focus-visibility, and screen-reader requirements? Keyboard operable? Return rankings 1-10 and list specific GRAFTS to merge into the winner.' },
]

const judges = (await parallel(LENSES.map(function(l) { return function() { return agent((CONTEXT + '\n\nFour designs were produced. Judge THROUGH ONE LENS ONLY: ' + l.key + '.\n\n' + l.ask + '\n\nHere are the four designs:\n\n' + DESIGN_DIGEST + '\n\nAlso read the real source files to check claims. Score each design 1-10, strict ranking, name one winner, list specific GRAFTS. Be decisive.') , { label: 'judge:' + l.key, phase: 'Judge', schema: JUDGE_SCHEMA })() } }))).filter(Boolean)
log((judges.length) + '/4 judges complete')

const JUDGE_DIGEST = judges.map(JL).join('\n\n')

// ---------------- PHASE 4: SYNTHESIZE ----------------
phase('Synthesize')

const spec = await agent((CONTEXT + '\n\n=== AUDITS ===\n' + AUDIT_DIGEST + '\n\n=== DESIGNS ===\n' + DESIGN_DIGEST + '\n\n=== JUDGES ===\n' + JUDGE_DIGEST + '\n\nRead the real source files. Produce a final spec that:\n1. Takes the winning design as spine and grafts judge elements.\n2. Resolve every judge conflict per conflict.\n3. Be COMPLETE and VERBATIM-READY: html (exact footer), css (every rule touched + new @media blocks + unchanged rules list), js (exact input functions), guarantees:\n   a. Arrow D-pad VISIBLE and PROMOTENT on mobile (currently display:none at max-width:900px)\n   b. WASD pad removed from mobile layout\n   c. Unmistakably on-brand mobile control\n   d. Nothing regresses: desktop layout, canvas, overlays, qmodal, swipe, tap-to-move, pause/quit, 3-col desktop\n4. Handles portrait, landscape, 320px, tablet, safe-area, hold-to-repeat, focus-visible, aria-labels, no horizontal overflow at 320px\n\nFields: summary, html, css, js, media_queries, visual_rationale, pixel_budget, a11y, verification_steps.') , { label: 'synthesize:spec', phase: 'Synthesize', schema: SPEC_SCHEMA, effort: 'high' })
log('spec synthesized')

// ---------------- PHASE 5: VERIFY ----------------
phase('Verify')

const VERIFY_LENSES = [
  {
    key: 'layout-overflow',
    prompt: 'Attack the SPEC for layout/overflow failures. Recompute vertical budget yourself. Footer overflow at 320px? Footer overflow vertically at 360px/390px tall landscape? D-pad overlapping question modal (qmodal z-index:80, footer z-index:100 — who wins)? Footer overlapping canvas? Flex/grid sizing mistakes? Concrete failures + exact CSS fix each.',
  },
  {
    key: 'contrast-and-a11y',
    prompt: 'Attack SPEC for contrast, target-size, focus, screen-reader. Recompute WCAG ratios for spec\'s actual colours vs backgrounds. D-pad glyph >=3:1 against own key bg and key bg >=3:1 behind it. New class covered by :focus-visible or change specified. aria-labels on arrows, wasd hidden from AT, pause/quit keep names. prefers-reduced-motion handling. Canvas worst-case floor colour behind D-pad. Issues: exact rule, standard, exact fix each.',
  },
  {
    key: 'js-logic',
    prompt: 'Attack SPEC JS for logic and event bugs. Trace hold-to-repeat: fires while paused (question modal open)? After gameOver()? After quitToMenu()? Repeat timer cleared on touchend/touchcancel/touchleave AND on element removal? Click+touchstart double binding still moves exactly one step after change (preventDefault)? Mouse hold-repeat breaks keyboard path or doubles move desktop? D-press triggers canvas tap-to-move (footer outside section.stage — verify DOM containment, and check document-level listeners)? Existing script.js binding of [upBtn2,up],... preserved? Other ids script.js references still exist? Issues: exact failure scenario + exact corrected code each.',
  },
]

const verdicts = (await parallel(VERIFY_LENSES.map(function(v) { return function() { return agent((CONTEXT + '\n\nHere is the FINAL SPEC about to be implemented (see fields html/css/js):\n' + JL(spec) + '\n\nRead the real source files. Attack this lens: ' + v.key + '\n\n' + v.prompt + '\n\nReport every genuine hole. Severity honest: critical = would visibly break game or ship regression, major = bad mobile experience, minor = polish. Prefer few precise verified findings. Empty array = no holes found in your lens — do not invent problems.') , { label: 'verify:' + v.key, phase: 'Verify', schema: VERIFY_SCHEMA })() } }))).filter(Boolean)

const holes = []
verdicts.forEach(function(v) { var hs = (v && v.holes) ? v.holes : []; holes = holes.concat(hs) })
log('verification found ' + holes.length + ' holes')

return { spec: spec, designs: designs.map(function(d) { return { name: d.name, concept: d.concept, scores: d.scores } }), judges: judges, holes: holes }
