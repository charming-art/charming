// The points of the outline of a primitive, in the coordinates it's drawn in, and whether it's
// closed: the corners of a rect, points along a circle, the vertices of a triangle or polygon, or
// the ends of a line. Other primitives, such as paths and texts, have no outline, so they don't
// morph. A primitive caught in the middle of a morph keeps its points.
export function outlineOf({type, attrs, points}) {
  if (points) return {points, closed: true};
  const {x = 0, y = 0} = attrs;
  if (type === "rect") return rect(attrs);
  if (type === "circle") return circle(x, y, attrs.r ?? 0);
  if (type === "point") return circle(x, y, 0.5);
  if (type === "triangle") return polygon([x, attrs.x1, attrs.x2], [y, attrs.y1, attrs.y2]);
  if (type === "polygon") return polygon(attrs.x, attrs.y);
  if (type === "line")
    return {
      points: [
        [x, y],
        [attrs.x1 ?? x, attrs.y1 ?? y],
      ],
      closed: false,
    };
  return null;
}

function rect({x = 0, y = 0, width = 0, height = 0, rotate, anchor}) {
  if (anchor === "center") {
    x -= width / 2;
    y -= height / 2;
  }
  const points = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ];
  // Like the renderers, a rect turns around its center.
  return {points: rotate ? turn(points, rotate, x + width / 2, y + height / 2) : points, closed: true};
}

function circle(x, y, r) {
  const n = 64;
  const points = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    points[i] = [x + r * Math.cos(a), y + r * Math.sin(a)];
  }
  return {points, closed: true};
}

function polygon(X = [], Y = []) {
  const points = new Array(X.length);
  for (let i = 0; i < X.length; i++) points[i] = [X[i], Y[i]];
  return {points, closed: true};
}

function turn(points, angle, cx, cy) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(([x, y]) => [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos]);
}

// The points of an outline on the screen: the translations and rotations it's drawn in, applied to
// its points, from the innermost.
export function project(points, ops) {
  let projected = points;
  for (let i = ops.length - 1; i >= 0; i--) {
    const [op, a, b] = ops[i];
    if (op === "translate") projected = projected.map(([x, y]) => [x + a, y + b]);
    else if (op === "rotate") projected = turn(projected, a, 0, 0);
  }
  return projected;
}

// The length of an outline.
export function lengthOf(points, closed) {
  let length = 0;
  const n = points.length;
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % n];
    length += Math.hypot(x1 - x0, y1 - y0);
  }
  return length;
}

// An outline with n points, evenly spaced along its length, so that two outlines can be morphed
// point by point.
export function resample(points, closed, n) {
  const length = lengthOf(points, closed);
  const count = points.length;
  if (!count) return Array.from({length: n}, () => [0, 0]);
  if (!length) return Array.from({length: n}, () => points[0].slice());
  const step = length / (closed ? n : n - 1);
  // A closed outline has a segment back to its first point.
  const segments = closed ? count : count - 1;
  const resampled = [];
  let segment = 0;
  let start = 0;
  for (let k = 0; k < n; k++) {
    const target = k * step;
    while (segment < segments) {
      const [x0, y0] = points[segment];
      const [x1, y1] = points[(segment + 1) % count];
      const l = Math.hypot(x1 - x0, y1 - y0);
      if (start + l >= target || segment === segments - 1) {
        const t = l ? Math.min(1, (target - start) / l) : 0;
        resampled.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
        break;
      }
      start += l;
      segment++;
    }
  }
  return resampled;
}

// The outline b turned to start at the point that best lines up with a, so that a morph doesn't
// twist: the offset with the smallest sum of squared distances.
export function align(a, b) {
  const n = a.length;
  let best = 0;
  let min = Infinity;
  for (let k = 0; k < n; k++) {
    let sum = 0;
    for (let i = 0; i < n && sum < min; i++) {
      const [ax, ay] = a[i];
      const [bx, by] = b[(i + k) % n];
      sum += (ax - bx) ** 2 + (ay - by) ** 2;
    }
    if (sum < min) {
      min = sum;
      best = k;
    }
  }
  return best ? b.slice(best).concat(b.slice(0, best)) : b;
}

// The d of a path through points.
export function pathOf(points, closed) {
  let d = "";
  for (let i = 0; i < points.length; i++) d += `${i ? "L" : "M"}${points[i][0]},${points[i][1]}`;
  return closed ? `${d}Z` : d;
}
