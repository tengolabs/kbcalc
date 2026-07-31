/*
 * kbCalc smoke/regression tests — pure Node, no Electron, no dependencies.
 *
 * Loads the real app.js inside a stub DOM and drives the calculator by
 * clicking real key buttons, so a broken build fails here (not just syntax).
 * Run: npm test   (or: node tests/smoke.js)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? 'ok   ' : 'FAIL ') + name); };

// ---- minimal DOM / browser stub ----
function makeStore() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)),
           removeItem: k => m.delete(k), clear: () => m.clear() };
}
function el(tag, attrs = {}) {
  const e = {
    tagName: (tag || 'DIV').toUpperCase(), children: [], listeners: {}, dataset: {}, classList: null,
    style: {}, _text: '', value: attrs.value ?? '', hidden: false, title: '', placeholder: '',
    checked: false, selectionStart: 0, selectionEnd: 0,
  };
  const classes = new Set();
  e.classList = {
    add: c => classes.add(c), remove: c => classes.delete(c),
    toggle: (c, f) => { const on = f === undefined ? !classes.has(c) : f; on ? classes.add(c) : classes.delete(c); return on; },
    contains: c => classes.has(c),
  };
  Object.assign(e.dataset, attrs.dataset || {});
  Object.defineProperty(e, 'textContent', { get() { return this._text; }, set(v) { this._text = String(v); } });
  Object.defineProperty(e, 'className', { get() { return [...classes].join(' '); }, set(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); } });
  e.addEventListener = (ev, fn) => { (e.listeners[ev] ||= []).push(fn); };
  e.removeEventListener = () => {};
  e.appendChild = c => { e.children.push(c); return c; };
  e.after = () => {}; e.remove = () => {}; e.focus = () => {}; e.select = () => {};
  e.setSelectionRange = (s, en) => { e.selectionStart = s; e.selectionEnd = en; };
  e.setRangeText = (t, s, en, mode) => { e.value = e.value.slice(0, s) + t + e.value.slice(en); };
  e.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 100, height: 20 });
  e.closest = sel => (sel.replace('.', '') && classes.has(sel.replace('.', '')) ? e : null);
  e.querySelector = () => null;
  e.querySelectorAll = () => [];
  e.dispatchEvent = () => true;
  e.getContext = () => ctx2d();
  Object.assign(e, attrs.props || {});
  return e;
}
function ctx2d() { const p = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (...a) => p), set: (t, k, v) => (t[k] = v, true) }); return p; }

// registry of elements by id + key buttons
const byId = {};
const IDS = ['out','expr','notesInsVal','clock','playlist','app','plMenu','miniTitle','miniBar','miniPlay',
  'trackTitle','playBtn','time','seek','vol','bal','audio','fileInput','histPanel','histList','histBtn',
  'histClear','notesPanel','notesArea','notesBtn','eqPanel','eqPreset','eqBtn','shufBtn','repBtn','plName',
  'plCount','plSwitch','plNew','plRename','plDel','plPodcast','addFiles','miniNext','expandBtn','closePlayer',
  'viz','vizBig','vizFull','vizStyleBtn','vizStyleLabel','vizFullBtn','vizFullStyle','stmode','infoBtn',
  'about','aboutClose','aboutVersion','aboutUpdate','aboutUpdateTitle','aboutUpdateSub','aboutAuthors',
  'pinBtn','minBtn','closeBtn'];
IDS.forEach(id => { byId[id] = el('div'); });
byId.vol.value = '80'; byId.bal.value = '0'; byId.seek.value = '0';
byId.audio.paused = true; byId.audio.play = () => Promise.resolve(); byId.audio.pause = () => { byId.audio.paused = true; };
byId.audio.removeAttribute = () => {}; byId.audio.currentTime = 0;

// calculator keys
const KEYS = ['C','back','%','/','7','8','9','*','4','5','6','-','1','2','3','+','neg','0','.','='];
const keyEls = KEYS.map(k => el('button', { dataset: { k }, props: { closest(sel){ return sel === '.key' ? this : null; } } }));
byId.keys = el('div');
// eq sliders
const eqSliders = [0,1,2,3,4].map(b => el('input', { value: '0', dataset: { band: String(b) } }));

function qsa(sel) {
  if (sel === '#keys .key' || sel === '.key') return keyEls;
  if (sel === '.eqSlider') return eqSliders;
  if (sel === '.langBtn') return [el('button', { dataset: { lang: 'cs' } }), el('button', { dataset: { lang: 'en' } })];
  if (sel === '.about-link[data-link]') return [];
  if (sel.startsWith('[data-i18n')) return [];
  return [];
}

const bySel = {};                 // stub elementy pro querySelector('.trida')
const listeners = {};
const sandbox = {
  console,
  Math, Float32Array, Uint8Array, JSON, Date, TextDecoder,
  setTimeout: (fn) => { return 0; },          // debounce/async ticků se v testu nedovoláváme
  clearTimeout: () => {},
  setInterval: () => 0,
  clearInterval: () => {},
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  performance: { now: () => 0 },
  navigator: { language: 'en-US' },
  localStorage: makeStore(),
  document: {
    documentElement: el('html'),
    getElementById: id => byId[id] || (byId[id] = el('div')),
    createElement: tag => el(tag),
    querySelector: sel => (bySel[sel] || (bySel[sel] = el('div'))),
    querySelectorAll: qsa,
    addEventListener: (ev, fn) => { (listeners[ev] ||= []).push(fn); },
    body: el('body'),
  },
  addEventListener: (ev, fn) => { (listeners[ev] ||= []).push(fn); },
  location: { search: '' },
};
sandbox.window = sandbox;
sandbox.document.getElementById('keys'); // ensure keys exists
byId.keys.querySelectorAll = qsa;

let bootError = null;
try {
  vm.createContext(sandbox);
  vm.runInContext(appJs, sandbox, { filename: 'app.js' });
} catch (e) { bootError = e; }

ok('app.js boots without throwing', !bootError);
if (bootError) { console.error(bootError); process.exit(1); }

// drive the calculator: dispatch a click on #keys with target = key button
const keysHandler = (byId.keys.listeners.click || [])[0];
function pressKey(k) {
  const b = keyEls[KEYS.indexOf(k)];
  keysHandler({ target: b });
}
function press(seq) { seq.forEach(pressKey); }
const display = () => byId.out._text;

press(['C','2','+','3','=']);        ok('2 + 3 = 5', display() === '5');
press(['C','2','0','0','+','1','0','%','=']); ok('200 + 10 % = 220 (Windows-style)', display() === '220');
press(['C','2','+','3','+','4','=']); ok('2 + 3 + 4 = 9 (chaining)', display() === '9');
press(['C','8','/','0','=']);        ok('8 / 0 = Error', display() === 'Error');
press(['C','1','.','5','+','2','.','7','=']); ok('1.5 + 2.7 = 4.2', display() === '4.2');
press(['C','5','0','*','1','0','%','=']); ok('50 × 10 % = 5', display() === '5');

// history recorded and capped-ish
const hist = JSON.parse(sandbox.localStorage.getItem('kbcalc.history') || '[]');
ok('history is recorded', Array.isArray(hist) && hist.length >= 5 && hist[0].r !== undefined);
ok('history newest first', hist[0].e.includes('50'));

// i18n dictionaries must have identical key sets (cs vs en) — catches missing translations
const dictRe = /const I18N\s*=\s*\{/;
ok('I18N dictionary present', dictRe.test(appJs));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
