import asyncio, json, sys
from playwright.async_api import async_playwright
import sys as _s,os as _o; _s.path.insert(0,'.')
from xrec import XRec, LAUNCH
TL=json.load(open('timeline.json'))
S={(s['seg'],s['j']):s for s in TL['sents']}
def at(seg,j,phrase=None,off=0.0):
    s=S[(seg,j)]; f=0
    if phrase: f=s['say'].lower().index(phrase.lower())/len(s['say'])
    return s['local']+s['dur']*f+off
BEATS={'intro':[
 (0,'hookIn'),(at('hook',0,None,0.3),'bars'),(at('hook',1,None,-0.2),'morning'),
 (at('hook',2,None,0),'swap1'),(at('hook',2,'number',0),'swap2'),(at('hook',2,'every',0),'codes'),
 (at('problem',0,None,-0.6),'probIn'),(at('problem',1),'notAns'),(at('problem',2),'worst'),
 (at('problem',2,'call back'),'c1'),(at('problem',2,'read out'),'c2'),(at('problem',2,'pay'),'c3'),(at('problem',3),'smb'),
 (at('solution',0,None,-0.5),'solIn'),(at('solution',1,None,-0.1),'words'),
 (at('solution',2),'p1'),(at('solution',2,'the reason'),'p2'),(at('solution',2,'and a real'),'p3'),(at('solution',3,'operator'),'sig')],
'outro':[
 (0,'resIn'),(at('results',1,None,-0.1),'bars2'),(at('results',1,'the included'),'base'),(at('results',2),'k1'),(at('results',2,'zero unsafe'),'k2'),(at('results',3),'k3'),
 (at('impact',0,None,-0.5),'impIn'),(at('impact',1),'imf'),(at('impact',2),'c1i'),(at('impact',2,'urgent'),'c2i'),(at('impact',2,'that can'),'pot'),
 (at('impact',3),'m1'),(at('impact',3,'a paid'),'m2'),(at('impact',4,None,-0.2),'adv'),
 (at('close',0,None,-0.6),'clIn'),(at('close',1),'cl2'),(at('close',2),'cl3')]}
async def main(block):
    dur=TL['bounds'][block][1]-TL['bounds'][block][0]
    _o.makedirs('rec_'+block+'/v.mp4'.rsplit('/',1)[0],exist_ok=True); R=XRec('rec_'+block+'/v.mp4'); R.start_x()
    async with async_playwright() as p:
        b=await p.chromium.launch(**LAUNCH)
        ctx=await b.new_context(no_viewport=True)
        pg=await ctx.new_page()
        await pg.goto('file:///home/claude/video/build/scenes.html'); await pg.wait_for_timeout(1500)
        R.start_cap()
        await pg.evaluate('tl=>go(tl)',[[t,k] for t,k in BEATS[block]])
        await pg.wait_for_timeout(int((dur+0.8)*1000))
        R.stop()
        try: await b.close()
        except Exception: pass
block=sys.argv[1]
import shutil; shutil.rmtree('rec_'+block,ignore_errors=True)
asyncio.run(main(block))
