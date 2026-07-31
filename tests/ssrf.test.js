/*
 * Unit test for the SSRF address filter (main.js: ipIsPrivate). Extracts the
 * pure function from main.js and checks that private / loopback / link-local
 * ranges are refused and public addresses pass. Pure Node, no dependencies.
 *
 * This guards a security invariant: a hostile podcast feed must not be able to
 * make the app reach localhost / the LAN / cloud metadata.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mainJs = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? 'ok   ' : 'FAIL ') + name); };

const m = mainJs.match(/function ipIsPrivate\(ip\)\s*\{[\s\S]*?\n\}/);
ok('found ipIsPrivate in main.js', !!m);
if (!m) { console.log('\n0 passed, 1 failed'); process.exit(1); }
const ipIsPrivate = vm.runInNewContext(m[0] + '\nipIsPrivate');

const BLOCKED = ['127.0.0.1', '0.0.0.0', '10.0.0.20', '10.255.255.255', '172.16.0.1',
  '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '224.0.0.1',
  '::1', 'fe80::1', 'fc00::1', 'fd12:3456::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1'];
const ALLOWED = ['1.1.1.1', '8.8.8.8', '93.184.216.34', '172.15.0.1', '172.32.0.1',
  '192.167.0.1', '2606:4700:4700::1111'];

for (const ip of BLOCKED) ok('blocks ' + ip, ipIsPrivate(ip) === true);
for (const ip of ALLOWED) ok('allows ' + ip, ipIsPrivate(ip) === false);
// garbage must be treated as private (fail closed)
ok('blocks garbage', ipIsPrivate('') === true && ipIsPrivate('999.1.1.1') === true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
