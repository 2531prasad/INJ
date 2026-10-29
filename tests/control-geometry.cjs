/* Run in the page: shaped controls may share bounding boxes, never actual hit regions. */
module.exports = function controlsFit() {
  const elements = [...document.querySelectorAll('#pad .abtn:not([hidden]),#stickZone,#btnArenaMenu')]
    .filter(el => el.getClientRects().length);
  const arena = document.querySelector('#screen').getBoundingClientRect();
  const polygons = [];
  for (const el of elements) {
    const r = el.getBoundingClientRect(), style = getComputedStyle(el);
    if (r.width < 44 || r.height < 44 || r.left < arena.left - 0.1 || r.right > arena.right + 0.1 ||
      r.top < arena.top - 0.1 || r.bottom > arena.bottom + 0.1) return false;
    const x = el.dataset.act ? r.left + parseFloat(style.getPropertyValue('--label-x')) : r.left + r.width / 2;
    const y = el.dataset.act ? r.top + parseFloat(style.getPropertyValue('--label-y')) : r.top + r.height / 2;
    if (!el.contains(document.elementFromPoint(x, y))) return false;
    const clip = style.getPropertyValue('--hit-shape').trim();
    polygons.push(clip.startsWith('polygon(') ? clip.slice(8, -1).split(',').map(pair => {
      const [x, y] = pair.trim().split(/\s+/).map(parseFloat);
      return [r.left + r.width * x / 100, r.top + r.height * y / 100];
    }) : [[r.left, r.top], [r.right, r.top], [r.right, r.bottom], [r.left, r.bottom]]);
  }
  const cross = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const inside = (point, polygon) => {
    let result = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if ((a[1] > point[1]) !== (b[1] > point[1]) &&
        point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
    }
    return result;
  };
  const intersects = (a, b) => {
    if (a.some(p => inside(p, b)) || b.some(p => inside(p, a))) return true;
    for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
      const p = a[i], q = a[(i + 1) % a.length], r = b[j], s = b[(j + 1) % b.length];
      if (cross(p, q, r) * cross(p, q, s) < -1e-7 && cross(r, s, p) * cross(r, s, q) < -1e-7) return true;
    }
    return false;
  };
  return !polygons.some((p, i) => polygons.slice(i + 1).some(q => intersects(p, q)));
};
