import sys, os, qrcode
url = sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/index.html'
img = qrcode.make(url)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'qr-entry.png')
img.save(out)
print('Saved', out, '->', url)
