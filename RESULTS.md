# Results: Mitä nyt?

*DNA challenge: Digital Security Assistant: What Should I Do Now? · Since AI Hackathon 2026*

## 1. What we built
We built a deterministic, auditable safety assistant (JavaScript, runs in the browser or in Node) that plugs directly into the SimSet protocol for both single-turn and multi-turn use. It recognises the situation with about 60 playbooks, keyed on generic cues: what is being asked for, what the user already did, who the message or call claims to be from, and the visible signals. A fixed policy then decides the action, the risk level, whether to ask one decisive question, which consent-gated signals to request and whether to hand off to a human. The answer is composed from a reviewed FI/EN/SV sentence library, so no free-form advice is ever generated. The demo uses the same engine.

## 2. Safety boundaries
These are enforced in code:
- Forwarded message text is never treated as instructions. Text addressed to AI assistants is stripped and flagged to the user.
- The assistant never asks for passwords, codes or card numbers, and hand-off summaries redact them.
- Consent-gated signals are used only after "Allow" and only when needed. If the user refuses, the advice still works.
- The bot takes no account action. SIM lock, sign-out and blocking are done by a person after approval.
- A "not sure" answer is treated as the riskier branch, and confidence is reported with every answer.

## 3. Five journeys (dev split, official evaluator)

| Journey | Dev cases | Safe-action pass | False alarms (benign) | Escalation recall | Rules baseline pass |
|---|---|---|---|---|---|
| Suspicious message | 156 | 100 % | 0 / 48 | – | 92.3 % |
| Clicked link | 84 | 100 % | 0 / 12 | 24 / 24 | 65.5 % |
| Suspicious call | 72 | 100 % | 0 / 12 | 24 / 24 | 13.9 % |
| Breach notice | 120 | 100 % | 0 / 24 | 24 / 24 | 48.3 % |
| Small-business incident | 156 | 100 % | 0 / 36 | 60 / 60 | 57.1 % |
| **All** | **588** | **100 % (CI 100–100)** | **0 / 132** | **132 / 132** | **60.5 %** |

- **Single-turn:** weighted proxy 99.7. Correctness 99.6, clarity 100, uncertainty and escalation 99.1, privacy and consent 100.
- **Multi-turn** (`sim/run_conversation.py`, simulated user): 100 % pass, proxy 99.9, 0.2 questions per case, 0 unnecessary questions, 0 consent violations.
- Evaluator: `python3 eval/evaluate.py --cases data/dev/cases.jsonl --submission results/dev_single_turn.jsonl` (SimSet v2.0.1).
- **Caveat:** the playbooks were designed while looking at the dev families, so these numbers are optimistic. The honest signals are:
  - the test set, which includes 9 unseen families handled by playbooks written from the public guidance corpus, with no ground truth seen;
  - 30 free-typed situations written after the build: 30/30 acceptable actions (`results/live_free_text.txt`);
  - 136 situations written by independent reviewers who never saw the code: 136/136 acceptable actions, 0 under-reactions (`bot/council_test.js`);
  - the stress test in the README, which shows how the assistant degrades when wording or the shared message is missing.

## 4. False alarms
On dev, none of the 132 benign cases was treated as an incident.

In the stress test where the user does not share the message, false alarms rise to 47 % (0 under-reactions). Without the actual text, a "my bank texted me" story is treated with caution: verify through the official channel, which is safe but over-cautious. We consider that the right direction to fail in.

## 5. Failure and escalation examples
**Escalation (DSA-D-0337, eSIM moved, no signal, FI):**
1. The assistant asks consent for subscription events.
2. It asks the one decisive question: "Teitkö tämän muutoksen tai tilauksen itse?" ("Did you make this change yourself?")
3. The user answers "En ole tilannut mitään eSIMiä…" ("I haven't ordered any eSIM…").
4. The assistant replies: contact operator support now, lock the number and stop SIM changes, contact your bank. It then offers a hand-off to an operator agent with a redacted summary.

If the user had answered "yes, I moved it myself", it would have said this is expected and nothing is needed.

**Failure found and fixed during the build:** the live-typed sentence "Mun mummolle soitettiin pankista ja hän antoi tunnuslukunsa" ("Grandma got a call from the bank and gave her PIN codes") fell to the generic fallback. There were two causes: the call verb form "soitettiin" was not recognised, and the codes were given by a third person. We fixed both by recognising calls from the user's own words and by adding generic rules for what was given away (codes, card details, money) regardless of who asked. Lesson: regular expressions miss inflection. In production, an LLM should only map wording to a playbook, with the policy kept deterministic.

**Independent review ("council") and what we fixed.** Three separate reviewers (a DNA product owner, a fraud/security expert and a UX/pitch juror) tested the system without seeing how it was built. They found real problems, and all of them are now regression tests in `bot/redteam_test.js` (35/35 pass):
- *False reassurance:* the word "myself"/"itse" could route to "you don't need to do anything" even after a loss ("olen itse jo maksanut 500e huijarille"). Fixed: "self-initiated" now needs an explicit benign action, and any loss or scam wording vetoes it.
- *Crisis:* "I want to kill myself, I lost my savings" got no crisis help. Now it gets 112 and the MIELI Crisis Helpline first (09 2525 0111 FI 24/7, 0112 SV, 0116 EN), then a trained adviser.
- *Under-reactions:* mobile key approvals, third-person bank IDs, "already paid", a Swedish "safe account" transfer, and a business giving remote access now all lead to the right urgent step.
- *Over-reactions:* "clicked but did not type anything" is now low risk, and a payment to a wrong account by mistake no longer suggests a police report.
- *Unsure:* "not sure" now gives only the riskier branch's advice and says so.

**Remaining known weakness:** in the stress test the assistant becomes more cautious when information is missing (47 % false alarms without the shared message), but has 0 under-reactions. Regex understanding of free text still misses unusual wording; the next step is an LLM that only maps wording to a situation.

## 6. Comprehension check
To be done at the event: read these three answers aloud to someone outside the team and note whether they can say what to do next.

| Case | Answer (first two sentences) |
|---|---|
| DSA-D-0056 (FI) | "Älä avaa viestin linkkiä. Tarkista asia pankin omasta sovelluksesta tai soittamalla kortin takana olevaan numeroon." ("Don't open the link in the message. Check it in your bank's own app or by calling the number on the back of your card.") |
| DSA-D-0355 (EN) | "Contact your bank now through its official number. Ask the bank to block your card." |
| DSA-D-0029 (EN) | "Before removing anything, plan your safety, because removing it may alert the other person. You can get help from a victim support service or someone you trust." |

Automated clarity proxies: answer in the user's language 100 %, action in the first two sentences 100 %, readable length and sentence length 100 %, no jargon.

## 7. Privacy and consent
- **Visible signals:** the shared message, link check, call warning, subscription products and device summary.
- **Consent-gated signals:** subscription events, logins, app installs, security findings and staff accounts. These are requested only for playbooks that need them, for example subscription events for an eSIM change or SIM order, logins for an unknown login, app installs for monitoring and APK cases, and staff accounts for a former employee's access.
- The request names exactly what will be read and why. If the user refuses, the advice continues without the data.
- `signals_used` and `consent_requested_for` are reported in every answer.

## 8. Packaging hypothesis for DNA (a hypothesis, not a result)
**Consumers:**
- Free inside the DNA app for every subscriber, opened from DNA's existing call warnings and link blocks: "What should I do now?"
- Value for DNA: trust, retention, and fewer and shorter support contacts.
- Optional "family protection" add-on, so a relative's scare reaches the same help.

**Small businesses:**
- Part of a DNA Business security bundle at about €5–9 per user per month.
- Includes human business-security support, invoice- and CEO-fraud playbooks, offboarding help and an incident log that supports NIS2 and GDPR duties.

**Why only an operator can do this:** SIM and eSIM changes, number porting, logins and network status are operator data. A bank or a generic chatbot cannot tell you that your eSIM just moved.

**Pilot metrics:** minutes from incident to first correct action, fraud losses avoided, support minutes per case, and NPS after an incident.

## 9. Where we are unsure about the ground truth
- **Unseen "investment withdrawal app" call:** we answer "do not interact" (don't install, don't pay more) and add "contact your bank" and "report to the police", because the user already deposited €250. "Contact bank" as the primary action would also be defensible.
- **Router with unknown devices:** we chose "change password" (secure the router). "Contact operator support" could be an alternative for operator-provided routers.

## 10. Files
- `test_predictions.jsonl`: all 335 test inputs, validated with `tools/validate.py --submission` (OK).
- `results/`: dev single-turn and multi-turn predictions and evaluator output, the live free-text test, and test-set routing.
- Setup: see `README.md`. Run `scripts/evaluate.sh <SimSet dir>` and `python3 demo/build.py`.
