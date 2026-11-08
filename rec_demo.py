import asyncio, json, math, random, time
from playwright.async_api import async_playwright
import sys as _s,os as _o; _s.path.insert(0,'.')
from xrec import XRec, LAUNCH
random.seed(7)
TL=json.load(open('timeline.json'))
L={(s['seg'],s['j']):s['local'] for s in TL['sents'] if s['block']=='demo'}
DUR=TL['bounds']['demo'][1]-TL['bounds']['demo'][0]
CURSOR="""
(()=>{const add=()=>{if(document.getElementById('__c'))return;
const c=document.createElement('div');c.id='__c';
c.innerHTML='<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2.5 L4 19.5 L8.6 15.4 L11.6 22 L14.6 20.6 L11.7 14.2 L17.8 14.2 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
c.style.cssText='position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));transition:none';
document.documentElement.appendChild(c);
const r=document.createElement('div');r.id='__r';r.style.cssText='position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(15,110,90,.28);border:2px solid rgba(15,110,90,.55);z-index:2147483646;pointer-events:none;opacity:0;transform:scale(.3)';
document.documentElement.appendChild(r);
const blk=document.createElement('div');blk.id='__b';blk.style.cssText='position:fixed;inset:0;background:#000;z-index:2147483647';document.documentElement.appendChild(blk);
addEventListener('mousemove',e=>{c.style.transform='translate('+(e.clientX-4)+'px,'+(e.clientY-3)+'px)';},true);
addEventListener('mousedown',e=>{r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';r.animate([{opacity:1,transform:'scale(.3)'},{opacity:0,transform:'scale(1.25)'}],{duration:520,easing:'cubic-bezier(.2,.7,.3,1)'});c.animate([{transform:c.style.transform+' scale(1)'},{transform:c.style.transform+' scale(.86)'},{transform:c.style.transform+' scale(1)'}],{duration:220});},true);
};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();})();
"""
pos=[1100.0,420.0]; clicks=[]; T0=None
def now(): return time.monotonic()-T0
async def until(t):
    d=t-now()
    if d>0: await asyncio.sleep(d)
def ease(u): return u*u*(3-2*u)  # smoothstep
async def move(pg,x,y,dur=None):
    x0,y0=pos; dist=math.hypot(x-x0,y-y0)
    if dist<2: return
    dur=dur or min(1.1,0.35+dist/1400)
    # bezier control points with a gentle arc
    nx,ny=-(y-y0)/dist,(x-x0)/dist; arc=random.uniform(-0.12,0.12)*dist
    c1=(x0+(x-x0)*0.3+nx*arc, y0+(y-y0)*0.3+ny*arc); c2=(x0+(x-x0)*0.75+nx*arc*0.5, y0+(y-y0)*0.75+ny*arc*0.5)
    # slight overshoot target
    ox,oy=x+(x-x0)/dist*min(8,dist*0.02), y+(y-y0)/dist*min(8,dist*0.02)
    st=time.monotonic(); n=0
    while True:
        u=(time.monotonic()-st)/dur
        if u>=1: break
        e=ease(u)
        bx=(1-e)**3*x0+3*(1-e)**2*e*c1[0]+3*(1-e)*e*e*c2[0]+e**3*ox
        by=(1-e)**3*y0+3*(1-e)**2*e*c1[1]+3*(1-e)*e*e*c2[1]+e**3*oy
        await pg.mouse.move(bx,by); await asyncio.sleep(1/90)
    # settle
    for k in range(6):
        e=(k+1)/6; await pg.mouse.move(ox+(x-ox)*e,oy+(y-oy)*e); await asyncio.sleep(1/90)
    pos[0],pos[1]=x,y
async def center(pg,sel,dx=0,dy=0,fx=0.5,fy=0.5):
    b=await pg.locator(sel).first.bounding_box()
    return b['x']+b['width']*fx+dx, b['y']+b['height']*fy+dy
async def click(pg,sel,fx=0.5,fy=0.5,dx=0,dy=0,at=None,pre=0.25):
    x,y=await center(pg,sel,dx,dy,fx,fy)
    if at is not None:
        await until(at-pre-0.6)
    await move(pg,x,y)
    if at is not None: await until(at)
    else: await asyncio.sleep(pre)
    clicks.append(round(now(),3))
    await pg.mouse.down(); await asyncio.sleep(0.09); await pg.mouse.up()
async def wheel(pg,x,y,dy,dur=0.8):
    await move(pg,x,y)
    n=max(6,int(dur*14)); 
    for i in range(n):
        await pg.mouse.wheel(0,dy/n); await asyncio.sleep(dur/n)
async def drift(pg,x,y):
    await move(pg,x,y,dur=1.0)
async def main():
    global T0
    _o.makedirs('rec_demo/demo.mp4'.rsplit('/',1)[0],exist_ok=True); R=XRec('rec_demo/demo.mp4'); R.start_x()
    async with async_playwright() as p:
        b=await p.chromium.launch(**LAUNCH)
        ctx=await b.new_context(no_viewport=True)
        await ctx.add_init_script(CURSOR)
        pg=await ctx.new_page()
        await pg.goto('file:///home/claude/mitanyt2/dist/index.html'); await pg.wait_for_timeout(1500)
        await pg.mouse.move(*pos)
        R.start_cap()
        await pg.evaluate("document.getElementById('__b').remove()")
        T0=time.monotonic()
        # demo1
        await until(L[('demo1',0)]+0.3); await drift(pg,560,420)
        await click(pg,'.sc[data-i="3"]',fx=0.35,at=L[('demo1',1)]+0.9)
        await click(pg,'#thread .chip.pri',at=L[('demo1',2)]+2.6)
        await until(L[('demo1',3)]+0.2)
        x,y=await center(pg,'#thread .chip:not([disabled]) >> text=No'); await move(pg,x-60,y+40,dur=0.9)
        await click(pg,'#thread .chip:not([disabled]) >> text=No',at=L[('demo1',3)]+3.1)
        await until(L[('demo1',4)]+0.4)
        x,y=await center(pg,'#thread .ans h4',fx=0.75); await move(pg,x,y+18,dur=1.0)
        await click(pg,'#ho',at=L[('demo1',5)]+0.7)
        await until(L[('demo1',5)]+1.4)
        x,y=await center(pg,'#sheetin .sum',fx=0.6,fy=0.3); await move(pg,x,y,dur=1.0)
        await click(pg,'#so',at=L[('demo1',5)]+3.6)
        # demo2: scroll the scenario list down to "Can it be tricked?"
        await until(L[('demo2',0)]-1.9)
        y8=await pg.evaluate("document.querySelector('.sc[data-i=\"8\"]').getBoundingClientRect().top+scrollY")
        target=y8-330
        await wheel(pg,420,520,target-await pg.evaluate('scrollY'),dur=1.1)
        await click(pg,'.sc[data-i="8"]',fx=0.35,at=L[('demo2',0)]+1.0)
        await until(L[('demo2',1)]+0.25)
        tb=await pg.locator('#thread').bounding_box()
        st=await pg.evaluate("document.getElementById('thread').scrollTop")
        await wheel(pg,tb['x']+tb['width']*0.55,tb['y']+tb['height']*0.45,-(st-2),dur=0.7)
        await until(L[('demo2',1)]+2.6)
        x,y=await center(pg,'#thread .inj',fx=0.55); await move(pg,x,y+6,dur=0.9)
        await asyncio.sleep(0.6); await move(pg,x+70,y+14,dur=1.4)
        await until(L[('demo2',2)]+1.2)
        x,y=await center(pg,'#why .wi:nth-of-type(2)',fx=0.35); await move(pg,x,y,dur=1.0)
        await until(L[('demo2',2)]+3.0)
        rem=await pg.evaluate("(t=>t.scrollHeight-t.clientHeight-t.scrollTop)(document.getElementById('thread'))")
        await wheel(pg,tb['x']+tb['width']*0.55,tb['y']+tb['height']*0.5,min(420,rem-4),dur=0.6)
        # demo3: back up to the real parcel notice
        await until(L[('demo3',0)]-2.0)
        y9=await pg.evaluate("document.querySelector('.sc[data-i=\"9\"]').getBoundingClientRect().top+scrollY")
        await wheel(pg,420,420,(y9-300)-await pg.evaluate('scrollY'),dur=1.0)
        await click(pg,'.sc[data-i="9"]',fx=0.35,at=L[('demo3',0)]+0.6)
        await until(L[('demo3',0)]+2.2)
        x,y=await center(pg,'#thread .ans h4',fx=0.6); await move(pg,x,y+16,dur=1.0)
        # demo4: type
        await until(L[('demo4',0)]-0.6)
        await click(pg,'#inp',fx=0.3,at=L[('demo4',0)]+0.5)
        await until(L[('demo4',1)]-0.15)
        txt='My grandma gave her bank codes to a caller.'
        for ch in txt:
            await pg.keyboard.type(ch); await asyncio.sleep(random.uniform(0.035,0.075)+(0.08 if ch==' ' and random.random()<0.25 else 0))
        await asyncio.sleep(0.25)
        x,y=await center(pg,'#form button[type=submit], #form button'); await move(pg,x,y,dur=0.45)
        clicks.append(round(now(),3)); await pg.mouse.down(); await asyncio.sleep(0.08); await pg.mouse.up()
        await until(L[('demo4',2)]+0.5)
        x,y=await center(pg,'#thread .ans h4',fx=0.7); await move(pg,x,y+16,dur=1.1)
        await until(DUR+0.6)
        R.stop()
        try: await b.close()
        except Exception: pass
    json.dump({'clicks':clicks},open('rec_demo/clicks.json','w'))
    print('wheel/clicks',now() if T0 else 0, clicks)
asyncio.run(main())
