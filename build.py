import pathlib, json
d = pathlib.Path(__file__).parent; r = d.parent
h = (d/'app.html').read_text()
for k, f in [('STEPS','bot/steps.js'),('PLAYBOOKS','bot/playbooks.js'),('ENGINE','bot/engine.js')]:
    h = h.replace('/*%s*/' % k, (r/f).read_text())
h = h.replace('/*DATA*/null', (d/'demo_data.json').read_text()).replace('/*EVIDENCE*/null', (d/'evidence.json').read_text())
(r/'dist').mkdir(exist_ok=True); (r/'dist/index.html').write_text(h); print('built', len(h))
