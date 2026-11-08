import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro('/home/claude/video/tts/kokoro-v1.0.onnx','/home/claude/video/tts/voices-v1.0.bin')
S=json.load(open('script.json')); SR=24000
out=[]
for seg,sents in S:
    for j,(say,cap) in enumerate(sents):
        a,sr=k.create(say,voice='af_heart',speed=(1.0 if seg in ('hook','close') else 1.08),lang='en-us')
        # trim silence
        thr=0.01; idx=np.where(np.abs(a)>thr)[0]
        a=a[max(0,idx[0]-240):idx[-1]+2400]
        fn=f'wav/{seg}_{j}.wav'; sf.write(fn,a,SR)
        out.append(dict(seg=seg,j=j,say=say,cap=cap or say,file=fn,dur=len(a)/SR))
        print(seg,j,round(len(a)/SR,2))
json.dump(out,open('sents.json','w'),indent=1)
