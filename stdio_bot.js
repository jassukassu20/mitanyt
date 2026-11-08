// Multi-turn bot for sim/run_conversation.py --bot "node bot/stdio_bot.js"
const E = require('./engine.js');
const rl = require('readline').createInterface({ input: process.stdin });
let state = {};
rl.on('line', line => {
  let ev; try { ev = JSON.parse(line); } catch (e) { return; }
  if (ev.type === 'start') state = {};
  let reply;
  try { reply = E.step(ev, state); } catch (e) { reply = { type: 'final', answer: { risk_level: 'medium', primary_action: 'escalate_to_human', advice_text: 'I could not process this safely, so I am handing you to a person who can help.', escalation_required: true, signals_used: ['artifact'] } }; }
  if (reply && reply.answer) { delete reply.answer._view; delete reply.answer._playbook; delete reply.answer._steps_ids; }
  process.stdout.write(JSON.stringify(reply) + '\n');
});
