"""Read connected alpha bounds for the generated R8 atlas; never edit image pixels."""
from collections import deque
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
image = Image.open(root / 'assets/r8-sprites-v1.png').convert('RGBA')
w, h = image.size
alpha = image.getchannel('A').tobytes()
seen = bytearray(w * h)
components = []
for seed, value in enumerate(alpha):
    if value < 64 or seen[seed]:
        continue
    seen[seed] = 1
    todo = deque([seed])
    points = []
    while todo:
        i = todo.popleft()
        y, x = divmod(i, w)
        points.append((x, y))
        for j in (i - 1 if x else -1, i + 1 if x < w - 1 else -1,
                  i - w if y else -1, i + w if y < h - 1 else -1):
            if j >= 0 and not seen[j] and alpha[j] >= 64:
                seen[j] = 1
                todo.append(j)
    if len(points) > 2000:
        left = min(x for x, y in points)
        top = min(y for x, y in points)
        right = max(x for x, y in points)
        bottom = max(y for x, y in points)
        feet = [x for x, y in points if y >= bottom - (bottom - top) * .045]
        components.append(dict(x=left, y=top, w=right-left+1, h=bottom-top+1,
                               footX=sum(feet)/len(feet)))
if len(components) != 16:
    raise RuntimeError(f'Expected 16 poses, found {len(components)}')
components.sort(key=lambda b: b['y'] + b['h']/2)
frames = []
for row in range(4):
    frames.extend(sorted(components[row*4:row*4+4], key=lambda b: b['x']))
for i, frame in enumerate(frames):
    # Center car chassis; planted support feet anchor grounded robot poses.
    frame['anchorX'] = round(frame['w']/2 if i < 8 else frame['footX']-frame['x'], 2)
    frame['anchorY'] = frame['h']
    del frame['footX']
# Flying art includes exhaust beyond the tires/boots. Explicit source-space roots
# keep jets from moving the collision body's floor anchor.
for i, sx, sy in [(3, 1105, 154), (12, 151, 1130), (13, 485, 1150)]:
    frames[i]['anchorX'] = sx-frames[i]['x']
    frames[i]['anchorY'] = sy-frames[i]['y']
data = dict(width=w, height=h, neutralHeight=frames[8]['h'], frames=frames)
(root / 'assets/r8-frames.js').write_text(
    '/* Alpha bounds from tools/inspect-r8.py; source PNG unchanged. */\n'
    'window.InjR8Frames=' + json.dumps(data, separators=(',', ':')) + ';\n')
print(f'Inspected {len(frames)} R8 poses, {w}×{h}, alpha preserved.')
