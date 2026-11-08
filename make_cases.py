# Builds demo/demo_data.json from the SimSet (run from repo root): python3 demo/make_cases.py <SimSet dir>
# Order matters: the demo's scenario cards refer to these indices.
import json, sys, os, subprocess
SS = sys.argv[1]
L = lambda p: [json.loads(l) for l in open(os.path.join(SS, p))]
C = {c['case_id']: c for c in L('data/dev/cases.jsonl')}
T = L('data/test/inputs.jsonl')
subprocess.run(['node', 'bot/run_single.js', os.path.join(SS, 'data/test/inputs.jsonl'), '/tmp/_tp.jsonl', '/tmp/_tpb.json'], check=True, capture_output=True)
pb = {k: v.split(':')[0] for k, v in json.load(open('/tmp/_tpb.json')).items()}
pick = ['DSA-D-0324', 'DSA-D-0079', 'DSA-D-0003', 'DSA-D-0282', 'DSA-D-0283', 'DSA-D-0355', 'DSA-D-0161', 'DSA-D-0029', 'DSA-D-0241', 'DSA-D-0556', 'DSA-D-0506']
FIELDS = ['case_id', 'journey', 'audience', 'language', 'opening_message', 'signals', 'signal_availability', 'consent', 'entry_point']
out = []
for cid in pick:
    c = C[cid]; g = c['ground_truth']
    out.append({'kind': 'dev', 'case': {k: c[k] for k in FIELDS}, 'sim': c['simulation'],
                'ref': {'action': g['primary_action'], 'risk': g['risk_level'], 'branch': g['branch'], 'family': c['scenario_family']}})
import re
def body(t): a = t['signals'].get('artifact') or {}; return (t['opening_message'] + ' ' + (a.get('body') or '') + ' ' + (a.get('notes') or '')).lower()
ENG = lambda t: len(re.findall(r'\b(the|your|you|has|been|is|to|if|this|on|a)\b', body(t))) > 8
for want, lang, rx in [('voice_clone', 'en', ''), ('marketplace', 'en', ''), (None, 'en', r'(profile|certificate)')]:
    c = next(t for t in T if (want is None or pb[t['case_id']] == want) and t['language'] == lang and len(t['opening_message']) > 30 and re.search(rx, body(t)) and ENG(t))
    out.append({'kind': 'test', 'case': {k: c[k] for k in FIELDS}, 'sim': None, 'ref': None})
G = {}
for l in open(os.path.join(SS, 'data/reference/guidance_corpus.jsonl')):
    d = json.loads(l); G[d['id']] = {'en': d['title_en'], 'fi': d.get('title_fi') or d['title_en']}
json.dump({'cases': out, 'guidance': G}, open('demo/demo_data.json', 'w'), ensure_ascii=False)
print(len(out), 'demo cases:', [o['case']['case_id'] for o in out])
