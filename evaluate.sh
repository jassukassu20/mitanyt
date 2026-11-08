#!/bin/bash
# Usage: scripts/evaluate.sh /path/to/DNA_Digital_Security_Assistant_SimSet_v2.0.1
set -e
SS="$1"; R="$(cd "$(dirname "$0")/.." && pwd)"
node "$R/bot/run_single.js" "$SS/data/dev/cases.jsonl" "$R/results/dev_single_turn.jsonl"
node "$R/bot/run_single.js" "$SS/data/test/inputs.jsonl" "$R/test_predictions.jsonl"
(cd "$SS" && python3 sim/run_conversation.py --cases data/dev/cases.jsonl --bot "node $R/bot/stdio_bot.js" --out "$R/results/dev_multi_turn.jsonl")
(cd "$SS" && python3 eval/evaluate.py --cases data/dev/cases.jsonl --submission "$R/results/dev_single_turn.jsonl" | tee "$R/results/eval_dev_single_turn.txt")
(cd "$SS" && python3 eval/evaluate.py --cases data/dev/cases.jsonl --submission "$R/results/dev_multi_turn.jsonl" | tee "$R/results/eval_dev_multi_turn.txt")
(cd "$SS" && python3 tools/validate.py --submission "$R/test_predictions.jsonl")
node "$R/bot/live_test.js" | tee "$R/results/live_free_text.txt"
