import json
S=json.load(open('sents.json'))
GAP_IN=0.32; GAP_SEG=0.75
PRE={('hook',0):0.8,('hook',1):0.55,('hook',2):0.6,('problem',1):0.45,('solution',0):0.6,
     ('demo1',1):0.9,('demo1',2):0.9,('demo1',3):1.1,('demo1',4):1.5,('demo1',5):0.5,
     ('demo2',0):1.5,('demo2',1):0.8,('demo3',0):1.2,('demo4',0):1.6,('demo4',1):0.6,('demo4',2):1.3,
     ('results',0):1.5,('results',1):0.45,('results',2):0.4,('results',3):0.5,('impact',0):0.8,
     ('close',0):0.9,('close',1):0.5,('close',2):0.6}
POST={'close':3.2,'demo4':2.6,'solution':0.5,'demo1':0.6}
BLOCK={'hook':'intro','problem':'intro','solution':'intro','demo1':'demo','demo2':'demo','demo3':'demo','demo4':'demo','results':'outro','impact':'outro','close':'outro'}
t=0;prev=None;out=[];blocks={}
for s in S:
    k=(s['seg'],s['j'])
    if prev and prev!=s['seg']:
        t+=POST.get(prev,0)
    if BLOCK[s['seg']] not in blocks: blocks[BLOCK[s['seg']]]=[t,None]
    g=PRE.get(k, GAP_SEG if prev!=s['seg'] else GAP_IN)
    t+=g; s['start']=round(t,3); t+=s['dur']; s['end']=round(t,3); out.append(s); prev=s['seg']
    blocks[BLOCK[s['seg']]][1]=t
t+=POST.get(prev,0)
# block boundaries: each block ends where next starts
names=['intro','demo','outro']
bounds={}
for i,n in enumerate(names):
    st=0 if i==0 else bounds[names[i-1]][1]
    en=t if i==2 else (blocks[n][1]+ (blocks[names[i+1]][0]-blocks[n][1])*0) 
    bounds[n]=[st,None]
# put cut points: midway into the gap before first sentence of next block
firsts={n:min(s['start'] for s in out if BLOCK[s['seg']]==n) for n in names}
c1=firsts['demo']-0.6; c2=firsts['outro']-1.2
bounds={'intro':[0,c1],'demo':[c1,c2],'outro':[c2,t]}
for s in out: s['block']=BLOCK[s['seg']]; s['local']=round(s['start']-bounds[s['block']][0],3)
json.dump(dict(total=t,bounds=bounds,sents=out),open('timeline.json','w'),indent=1)
print(round(t,2),bounds)
for s in out: print(s['seg'],s['j'],s['start'],s['local'],round(s['dur'],2))
