"""Read alpha bounds and head anchors; source image pixels are never edited."""
from collections import deque
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
im = Image.open(root / 'assets/walk-cycle-v3.png').convert('RGBA')
w, h = im.size
alpha = im.getchannel('A').tobytes()
visited = bytearray(w * h)
components = []
for seed, value in enumerate(alpha):
    if value < 32 or visited[seed]:
        continue
    visited[seed] = 1
    todo, points = deque([seed]), []
    while todo:
        i = todo.popleft()
        y, x = divmod(i, w)
        points.append((x, y))
        for j in (i-1 if x else -1, i+1 if x<w-1 else -1, i-w if y else -1, i+w if y<h-1 else -1):
            if j >= 0 and not visited[j] and alpha[j] >= 32:
                visited[j] = 1
                todo.append(j)
    if len(points) < 5000:
        continue
    left, right = min(x for x,y in points), max(x for x,y in points)
    top, bottom = min(y for x,y in points), max(y for x,y in points)
    # Feet trade support, so their centroid cannot serve as the body root.
    # Align the stable crown instead; planted feet share the same ground line.
    crown = [x for x,y in points if y < top+(bottom-top)*.08]
    components.append(dict(x=left,y=top,w=right-left+1,h=bottom-top+1,
                           anchorX=round(sum(crown)/len(crown)-left,2),anchorY=bottom-top+1))
if len(components) != 8:
    raise RuntimeError(f'Expected eight sprites; found {len(components)}')
components.sort(key=lambda b: b['y']+b['h']/2)
result = {}
for row, kind in enumerate(('inj','dummy')):
    frames = sorted(components[row*4:row*4+4],key=lambda b:b['x']+b['w']/2)
    result[kind] = dict(width=w,height=h,neutralHeight=max(f['h'] for f in frames),frames=frames)
(root/'assets/walk-frames.js').write_text('/* Alpha bounds and stable crown anchors; tools/inspect-walk.py. */\nwindow.InjWalkFrames='+json.dumps(result,separators=(',',':'))+';\n')
print(json.dumps(result,indent=2))
