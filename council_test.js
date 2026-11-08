// Independent "council" test: 136 situations written by separate agents that never saw this code.
const fs = require('fs'), path = require('path'), E = require('./engine.js');
const R = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
const dir = path.join(__dirname, '..', 'council');
const rows = []; let ok = 0, under = 0, n = 0;
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.jsonl'))) for (const l of fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean)) {
  const c = JSON.parse(l); n++;
  const a = E.answer(E.fromText(c.text, c.audience));
  const pass = c.acceptable.includes(a.primary_action) && R[a.risk_level] >= R[c.min_risk] - 1;
  const u = R[a.risk_level] < R[c.min_risk] - 1; ok += pass; under += u;
  rows.push({ id: c.id, pass, under: u, got: a.primary_action + '/' + a.risk_level, exp: c.acceptable.join('|') + ' ≥' + c.min_risk, pb: a._playbook, text: c.text });
}
const v = process.argv.includes('-v');
for (const r of rows) if (!r.pass || v) console.log((r.pass ? 'OK  ' : 'MISS') + ' ' + r.id.padEnd(6) + ' ' + r.got.padEnd(40) + ' exp ' + r.exp.padEnd(55) + ' ' + (r.pb || '').padEnd(24) + r.text.slice(0, 110));
console.log(`\ncouncil: ${ok}/${n} acceptable (${(100 * ok / n).toFixed(1)}%), under-reactions: ${under}`);
