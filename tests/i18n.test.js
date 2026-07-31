/*
 * Checks the cs and en I18N dictionaries have identical key sets, and that
 * every data-i18n* key used in index.html exists in both. Catches the classic
 * "added a string in one language only" bug. Pure Node, no dependencies.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : fail++; console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra && !cond ? ' → ' + extra : '')); };

// pull the I18N literal out of app.js and eval just that object
const m = appJs.match(/const I18N\s*=\s*(\{[\s\S]*?\n  \});/);
ok('found I18N literal', !!m);
if (!m) { process.exit(1); }
const I18N = vm.runInNewContext('(' + m[1] + ')');

ok('has cs and en', I18N.cs && I18N.en);
const csKeys = Object.keys(I18N.cs).sort();
const enKeys = Object.keys(I18N.en).sort();
const onlyCs = csKeys.filter(k => !(k in I18N.en));
const onlyEn = enKeys.filter(k => !(k in I18N.cs));
ok('cs and en have identical keys', onlyCs.length === 0 && onlyEn.length === 0,
   'only cs: [' + onlyCs + '] only en: [' + onlyEn + ']');

// viz arrays must match in length
ok('viz arrays same length', Array.isArray(I18N.cs.viz) && I18N.cs.viz.length === I18N.en.viz.length);

// every data-i18n / data-i18n-title / data-i18n-ph key in HTML must exist in both dicts
const used = new Set();
for (const re of [/data-i18n="([^"]+)"/g, /data-i18n-title="([^"]+)"/g, /data-i18n-ph="([^"]+)"/g]) {
  let x; while ((x = re.exec(html))) used.add(x[1]);
}
const missing = [...used].filter(k => !(k in I18N.cs) || !(k in I18N.en));
ok('every data-i18n key in HTML is translated (cs+en)', missing.length === 0, 'missing: [' + missing + ']');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
