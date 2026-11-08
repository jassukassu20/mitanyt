import subprocess, os, time, signal
class XRec:
    def __init__(self,out,disp=':99'):
        self.out=out; self.disp=disp
    def start_x(self):
        self.x=subprocess.Popen(['Xvfb',self.disp,'-screen','0','1920x1080x24','-nolisten','tcp'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        time.sleep(1.0); os.environ['DISPLAY']=self.disp
    def start_cap(self):
        self.f=subprocess.Popen(['ffmpeg','-v','error','-y','-f','x11grab','-draw_mouse','0','-framerate','30','-video_size','1920x960','-i',self.disp+'.0+0,116',
            '-c:v','libx264','-preset','ultrafast','-crf','12','-pix_fmt','yuv444p',self.out],stdin=subprocess.PIPE)
        time.sleep(0.8)
    def stop(self):
        self.f.stdin.write(b'q'); self.f.stdin.flush(); self.f.wait(timeout=60)
        self.x.terminate()
LAUNCH=dict(executable_path='/usr/bin/google-chrome',headless=False,
  args=['--no-sandbox','--force-device-scale-factor=1.3333333','--window-position=0,0','--window-size=1440,807','--kiosk','--disable-features=Translate','--hide-scrollbars','--disable-infobars','--no-first-run','--noerrdialogs'],
  ignore_default_args=['--enable-automation'])
