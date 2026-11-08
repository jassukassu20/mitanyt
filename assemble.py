import json, subprocess, numpy as np, cv2, soundfile as sf, re, os
TL=json.load(open('timeline.json')); B=TL['bounds']; FPS=30
def off(f): return float(subprocess.check_output(['python3','sync.py',f]).decode().strip())
def dur(b): return B[b][1]-B[b][0]
os.makedirs('parts',exist_ok=True)
W,H=1920,960
def ss(u): u=min(1,max(0,u)); return u*u*(3-2*u)
KF=[(0,1,960,480),(3.6,1,960,480),(5.0,1.16,1240,470),(25.9,1.16,1240,470),(27.0,1,960,480),(30.4,1,960,480),(31.5,1.28,1000,420),(38.5,1.28,1000,420),(39.5,1,960,480),(43.4,1,960,480),(44.5,1.16,1240,470),(47.0,1.16,1240,470),(48.0,1.12,1150,600),(99,1.12,1150,600)]
def zoom_at(t):
    for a,b in zip(KF,KF[1:]):
        if a[0]<=t<=b[0]:
            u=ss((t-a[0])/max(1e-6,b[0]-a[0]))
            return [a[i]+(b[i]-a[i])*u for i in (1,2,3)]
    return KF[-1][1:]
def cut(block,src,dst,zoom=False):
    o=off(src); d=dur(block); n=int(round(d*FPS))
    dec=subprocess.Popen(['ffmpeg','-v','error','-ss',f'{o:.3f}','-i',src,'-frames:v',str(n),'-vf',f'fps={FPS}','-f','rawvideo','-pix_fmt','bgr24','-'],stdout=subprocess.PIPE)
    enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','fast','-crf','10','-pix_fmt','yuv444p',dst],stdin=subprocess.PIPE)
    last=None
    for i in range(n):
        buf=dec.stdout.read(W*H*3)
        if len(buf)<W*H*3: fr=last
        else: fr=np.frombuffer(buf,np.uint8).reshape(H,W,3); last=fr
        if zoom:
            z,cx,cy=zoom_at(i/FPS)
            if z>1.001:
                tx=min(0,max(W-W*z,W/2-cx*z)); ty=min(0,max(H-H*z,H/2-cy*z))
                fr=cv2.warpAffine(fr,np.float32([[z,0,tx],[0,z,ty]]),(W,H),flags=cv2.INTER_CUBIC)
        enc.stdin.write(fr.tobytes())
    enc.stdin.close(); enc.wait(); dec.kill()
    print(block,o,n)
cut('intro','rec_intro/v.mp4','parts/1.mp4')
cut('demo','rec_demo/demo.mp4','parts/2.mp4',zoom=True)
cut('outro','rec_outro/v.mp4','parts/3.mp4')
# ---- audio
SR=24000; total=TL['total']; mix=np.zeros(int((total+1)*SR),np.float32)
for s in TL['sents']:
    a,_=sf.read(s['file'],dtype='float32'); i=int(s['start']*SR); mix[i:i+len(a)]+=a
rng=np.random.default_rng(1); L=int(0.012*SR); env=np.exp(-np.arange(L)/(0.0018*SR))
click=(rng.standard_normal(L)*env).astype(np.float32); click=np.convolve(click,[1,-0.6],'same')*0.10
for c in json.load(open('rec_demo/clicks.json'))['clicks']:
    i=int((B['demo'][0]+c)*SR); mix[i:i+L]+=click
mix/=max(1.0,np.abs(mix).max()/0.89)
sf.write('parts/voice.wav',mix,SR)
# ---- captions
def ts(t,srt=False):
    h=int(t//3600);m=int(t%3600//60);s=t%60
    return f'{h:02d}:{m:02d}:{int(s):02d},{int((s%1)*1000):03d}' if srt else f'{h}:{m:02d}:{s:05.2f}'
def chunks(text,maxc=62):
    words=text.split(); out=[];cur=''
    # prefer splitting at sentence/comma boundaries
    parts=re.split(r'(?<=[.?!:])\s+',text)
    res=[]
    for p in parts:
        if len(p)<=maxc: res.append(p); continue
        cur=''
        for w in p.split():
            if len(cur)+len(w)+1>maxc: res.append(cur); cur=w
            else: cur=(cur+' '+w).strip()
        res.append(cur)
    # merge tiny neighbours
    m=[]
    for r in res:
        if m and len(m[-1])+len(r)+1<=maxc and (len(r)<28 or len(m[-1])<28): m[-1]+=' '+r
        else: m.append(r)
    return m
ev=[];srt=[]
for s in TL['sents']:
    cs=chunks(s['cap']); tot=sum(len(c) for c in cs); t=s['start']
    for c in cs:
        d=s['dur']*len(c)/tot; ev.append((t,t+d+ (0.25 if c==cs[-1] else 0),c)); t+=d
for i,(a,b,c) in enumerate(ev):
    if i+1<len(ev): b=min(b,ev[i+1][0]-0.02)
    srt.append(f'{i+1}\n{ts(a,1)} --> {ts(b,1)}\n{c}\n')
    ev[i]=(a,b,c)
open('../mitanyt_demo.srt','w').write('\n'.join(srt))
ass=['[Script Info]','ScriptType: v4.00+','PlayResX: 1920','PlayResY: 1080','WrapStyle: 2','',
'[V4+ Styles]','Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
'Style: Cap,Inter SemiBold,46,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1',
'Style: Tag,Inter SemiBold,23,&H00FFFFFF,&H00FFFFFF,&H00575E0E,&H30575E0E,0,0,0,0,100,100,0.5,0,3,9,0,3,0,0,0,1',
'','[Events]','Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
for a,b,c in ev:
    ass.append(f'Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{{\\pos(960,1020)\\fad(90,90)}}{c}')
d0,d1=B['demo']
ass.append(f'Dialogue: 1,{ts(d0+0.4)},{ts(d1-0.3)},Tag,,0,0,0,,{{\\pos(1888,936)\\fad(300,300)}}●  LIVE PROTOTYPE  ·  synthetic test data  ·  DNA signals simulated')
open('parts/caps.ass','w').write('\n'.join(ass))
open('parts/list.txt','w').write("file '1.mp4'\nfile '2.mp4'\nfile '3.mp4'\n")
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','parts/list.txt','-i','parts/voice.wav',
 '-filter_complex','[0:v]pad=1920:1080:0:0:color=0x16181f,subtitles=parts/caps.ass,format=yuv420p[v]',
 '-map','[v]','-map','1:a','-c:v','libx264','-preset','slow','-crf','17','-r','30','-c:a','aac','-b:a','192k','-ar','48000','-shortest','-movflags','+faststart','../mitanyt_demo.mp4'],check=True)
print('ok')
