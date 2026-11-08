// node bot/run_single.js <cases.jsonl> <out.jsonl>  — single-turn predictions in the SimSet submission format
const fs = require('fs');
const E = require('./engine.js');
const [, , inp, out] = process.argv;
const lines = fs.readFileSync(inp, 'utf8').split('\n').filter(Boolean);
const res = lines.map(l => { const a = E.answer(JSON.parse(l)); delete a._steps_ids; delete a._view; const pb = a._playbook; delete a._playbook; return { a, pb }; });
fs.writeFileSync(out, res.map(r => JSON.stringify(r.a)).join('\n') + '\n');
if (process.argv[4]) fs.writeFileSync(process.argv[4], JSON.stringify(Object.fromEntries(res.map(r => [r.a.case_id, r.pb]))));
console.error('wrote', res.length);
