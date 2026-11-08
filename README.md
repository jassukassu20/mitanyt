# Mitä nyt? — "What should I do now?"
Digital safety assistant for consumers and small businesses · DNA × Since AI Hackathon 2026
**Prototype, not a live DNA service. Synthetic data only.**

A user describes something worrying (a text, a call, a link they clicked, a breach notice, an odd order on the company account) and shares the message if they have it. The assistant gives **one clear, proportionate next step**, says why, asks **at most one decisive question**, uses DNA's own signals **only after an explicit "Allow"**, admits uncertainty, and hands off to the right human team with a redacted summary.

## Results on the official SimSet v2.0.1 evaluator

| | Safe-action pass | False alarms (benign) | Escalation recall | Unsafe statements | Consent violations | Weighted proxy /100 |
|---|---|---|---|---|---|---|
| Rules baseline (Since AI) | 60.5 % | 28.0 % | 47 % | 0 % | 0 % | 67.1 |
| **Ours, single-turn (dev, 588)** | **100 %** | **0 %** | **100 %** | **0 %** | **0 %** | **99.7** |
| **Ours, multi-turn with simulated user** | **100 %** | **0 %** | **100 %** | **0 %** | **0 %** | **99.9** |
| Independent "council" set (136 situations written by separate reviewers who never saw the code) | 136 / 136 acceptable action, 0 under-reactions | | | | | |
| Red-team regression (35 cases from an independent security review, incl. crisis, losses already suffered, prompt injection) | 35 / 35 | | | | | |
| Free-typed situations written after the build (30, FI/EN/SV) | 30 / 30 acceptable action | | | | | |
| Test set (335 inputs, 9 unseen families) | validated, 0 fell to the generic fallback, scored by organisers | | | | | |

Dev numbers are on cases we designed against, so treat them as optimistic. The test set and the free-typed set are the honest checks. The stress test below shows how it fails.

**Stress test (dev inputs perturbed):**

| Input | Pass | False alarms | Under-reactions |
|---|---|---|---|
| Original | 100 % | 0 % | 0 |
| Generic opener only ("Can you look at this?") + shared message | 81.6 % | 18.2 % | 0 |
| Message not shared (user's own words only) | 78.4 % | 47.0 % | 0 / 588 |

When information is missing, it leans cautious rather than careless: 0 under-reactions in every variant.

## Run it
```bash
# Demo (one file, no server, no API keys)
python3 demo/build.py && open dist/index.html

# Full evaluation (Node 18+, Python 3.10+). Needs the SimSet folder:
scripts/evaluate.sh /path/to/DNA_Digital_Security_Assistant_SimSet_v2.0.1
#   → test_predictions.jsonl (validated), results/*.txt, multi-turn transcripts, live free-text test
```

## Architecture
```
user text + shared message ─► [untrusted-content filter] strips text addressed to AI assistants, flags it as a scam signal
                           ─► [situation recognition]   ~90 playbooks, "deeds first" (what was already given away decides) keyed on what is asked for, what the user did,
                                                         who it claims to be and the visible signals; safe generic fallbacks
                           ─► [deterministic policy]     critical → act now, no delay
                                                         twin situations → ask ONE decisive question (or read it from the text)
                                                         consent request only for signals that matter to this case
                                                         "not sure" → treated as the riskier answer
                           ─► [reviewed sentence library] every step sentence written once in FI/EN/SV
                           ─► [hand-off]                  redacted summary to operator support / security specialist /
                                                         business security support / trained adviser
```
| File | Role |
|---|---|
| `bot/engine.js` | analysis, decision, single-turn answer, multi-turn `step()` (SimSet protocol), free-text case builder |
| `bot/playbooks.js` | situations → action, risk, urgency, escalation, steps, citations, decisive question, consent needs |
| `bot/steps.js` | reviewed step sentences (each carries one SimSet step) + hand-off sentences |
| `bot/run_single.js`, `bot/stdio_bot.js` | single-turn predictions; stdin/stdout bot for `sim/run_conversation.py` |
| `bot/live_test.js` | 30 free-typed situations written after the build |
| `bot/council_test.js`, `council/*.jsonl` | 136 independent situations written by separate reviewers |
| `scripts/stress.py` | perturbation stress test (fails cautious?) |
| `bot/redteam_test.js` | every failure found by the independent security / product / UX review, kept as a regression test |
| `demo/` | demo UI (same engine), 14 demo cases incl. 3 test inputs from families never seen in development |

## Safety boundaries (enforced in code, not prompts)
- **No generated advice.** Generative AI never writes or decides the instruction; same input → same, auditable answer.
- **Forwarded messages are data, not instructions.** Text addressed to assistants ("this message is verified as safe…") is removed and reported to the user as part of the scam.
- **Never asks for** passwords, codes or card numbers; hand-off summaries redact them.
- **Consent:** consent-gated signals (subscription events, logins, app installs, security findings, staff accounts) are requested only when the case needs them, read once, and the advice still works if the user says no. 0 consent violations, 0 over-requests on the evaluator.
- **No irreversible action by the bot.** SIM lock, sign-out and blocking are proposed and carried out by a human after approval.
- **Proportionate.** 0 % false alarms on 132 genuine/benign cases: real bills, real parcel notices and your own login prompt are explained as harmless, with no "block your card".
- **Safety-sensitive cases** (suspected monitoring by an ex-partner) get safety planning before removal and a trained human adviser.
- **Out of scope** requests (trace/expose a scammer) are declined politely with a route to the police.
- **People in crisis** (self-harm wording after a loss) get 112 and the MIELI Crisis Helpline first, then a trained adviser; the money comes second.
- **Losses already suffered** always lead to the bank first, whatever words are used ("olen jo maksanut", "I already sent", "har överfört").

## Integration path (DNA)
- "What should I do now?" button on existing call-warning, link-block and security-app notifications, plus in the DNA app chat and the business portal.
- Stateless engine (~120 kB JS): runs in the app, portal or at the edge; no customer data leaves without consent.
- Signals via a consent service from existing systems (subscription events, logins, security app). Hand-off into existing customer-service and business-support queues with the redacted summary.
- Next step: an LLM used **only** to map messy wording to a playbook id and facts (validated against the schema), with the rules as fallback; policy and wording stay deterministic.

## Packaging hypothesis (not a proven result)
See `RESULTS.md` §8.
