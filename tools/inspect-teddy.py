"""Inspect generated alpha islands and write anchors; never modify image pixels."""
from collections import deque
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]


def inspect(filename, count, columns):
    image = Image.open(root / 'assets' / filename).convert('RGBA')
    w, h = image.size
    alpha = image.getchannel('A').tobytes()
    seen = bytearray(w * h)
    components = []
    for seed, value in enumerate(alpha):
        if value < 96 or seen[seed]:
            continue
        seen[seed] = 1
        todo = deque([seed])
        points = []
        while todo:
            i = todo.popleft()
            y, x = divmod(i, w)
            points.append((x, y))
            for j in (i-1 if x else -1, i+1 if x < w-1 else -1,
                      i-w if y else -1, i+w if y < h-1 else -1):
                if j >= 0 and not seen[j] and alpha[j] >= 96:
                    seen[j] = 1
                    todo.append(j)
        if len(points) < 4000:
            continue
        left, top = min(x for x, y in points), min(y for x, y in points)
        right, bottom = max(x for x, y in points), max(y for x, y in points)
        feet = [x for x, y in points if y >= bottom - (bottom-top)*.04]
        components.append(dict(x=left, y=top, w=right-left+1, h=bottom-top+1,
                               anchorX=round(sum(feet)/len(feet)-left, 2),
                               anchorY=bottom-top+1))
    if len(components) != count:
        raise RuntimeError(f'{filename}: expected {count} silhouettes, found {len(components)}: {components}')
    components.sort(key=lambda f: f['y'] + f['h']/2)
    frames = []
    for row in range(count // columns):
        frames.extend(sorted(components[row*columns:(row+1)*columns], key=lambda f: f['x']))
    # Airborne poses use their body center, rather than an outstretched front paw.
    if count == 16:
        for i in [8, 10, 14]:
            frames[i]['anchorX'] = round(frames[i]['w']*.47, 2)
    return dict(width=w, height=h, neutralHeight=frames[0]['h'], frames=frames)


data = dict(teddy=inspect('teddy-sprites-v1.png', 16, 4),
            cameo=inspect('doraemon-sprites-v1.png', 4, 2))
(root / 'assets/teddy-frames.js').write_text(
    '/* Alpha bounds from tools/inspect-teddy.py; source PNGs unchanged. */\n'
    'window.InjTeddyFrames = ' + json.dumps(data, indent=2) + ';\n')
for name, sheet in data.items():
    print(name, sheet)
