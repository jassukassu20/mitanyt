import subprocess,sys,numpy as np,re
f=sys.argv[1]
p=subprocess.run(['ffmpeg','-v','info','-i',f,'-t','4','-vf','scale=96:48,showinfo','-f','rawvideo','-pix_fmt','gray','-'],capture_output=True)
ts=[float(x) for x in re.findall(r'pts_time:([\d.]+)',p.stderr.decode())]
fr=np.frombuffer(p.stdout,np.uint8).reshape(-1,48*96).mean(1)
dark=False
for t,m in zip(ts,fr):
    if m<100: dark=True
    elif dark: print(t); break
