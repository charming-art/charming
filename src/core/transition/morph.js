import {interpolateAttrs} from "./interpolate.js";
import {align, lengthOf, outlineOf, pathOf, project, resample} from "./outline.js";

// The attributes that paint a morphing primitive; its geometry morphs as an outline.
const paints = ["fill", "stroke", "fillOpacity", "strokeOpacity", "strokeWidth", "strokeCap", "strokeJoin"];

// The primitives that the renderers fill black without a fill, unlike a path, which they don't.
const filled = new Set(["rect", "circle", "point", "triangle", "polygon"]);

// The paint of a primitive, with the defaults its renderers draw it with, so that the path of a
// morph looks like the shapes at its ends: black without a fill, and a point's black stroke.
function paintOf({type, attrs}) {
  const paint = {};
  for (const key of paints) if (attrs[key] !== undefined) paint[key] = attrs[key];
  if (paint.fill === undefined) paint.fill = filled.has(type) ? "black" : "none";
  if (type === "point" && paint.stroke === undefined) paint.stroke = "#000";
  return paint;
}

// Whether a primitive can morph: it has an outline.
export function morphable(primitive) {
  return outlineOf(primitive) !== null;
}

// The outline of a primitive on the screen.
function screenOf(primitive) {
  const {points, closed} = outlineOf(primitive);
  return {points: project(points, primitive.ops ?? []), closed};
}

// The box of a primitive on the screen: [x0, y0, x1, y1].
export function boxOf(primitive) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of screenOf(primitive).points) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

// Count pieces of a box, in rows from the top left, with as many columns as the box's aspect allows,
// like G2's pack: the pieces that a mark splits into, or that marks merge into. The pieces of the
// last row, if it's shorter, are wider, so that the pieces fill the box without leftover.
export function pack([x0, y0, x1, y1], count) {
  const width = x1 - x0;
  const height = y1 - y0;
  const cols = Math.max(1, Math.ceil(Math.sqrt((count * width) / (height || 1))));
  const rows = Math.ceil(count / cols);
  const last = (rows - 1) * cols;
  const h = height / rows;
  const pieces = new Array(count);
  for (let i = 0; i < count; i++) {
    const w = width / (i < last ? cols : count - last);
    const col = i < last ? i % cols : i - last;
    pieces[i] = [x0 + col * w, y0 + Math.floor(i / cols) * h, w, h];
  }
  return pieces;
}

// The paint at both ends of a morph, where a fill or stroke that only one end has is given to the
// other end transparent, so that it fades in or out rather than appearing at the end.
function fade(from, to) {
  from = {...from};
  to = {...to};
  for (const [key, opacity] of [
    ["fill", "fillOpacity"],
    ["stroke", "strokeOpacity"],
  ]) {
    const a = from[key] === undefined || from[key] === "none";
    const b = to[key] === undefined || to[key] === "none";
    if (a && !b) {
      from[key] = to[key];
      from[opacity] = 0;
    } else if (b && !a) {
      to[key] = from[key];
      to[opacity] = 0;
    }
  }
  return [from, to];
}

// The operations of a primitive up to its last clip, which what morphs from or into it keeps, so
// that it stays clipped; none if they turn it, as a box on the screen then isn't a box in them.
export function clipsOf({ops = []}) {
  let i = ops.length;
  while (i > 0 && ops[i - 1][0] !== "clip") i--;
  const clips = ops.slice(0, i);
  return clips.some(([op]) => op === "rotate") ? [] : clips;
}

// Points on the screen in the coordinates of operations without rotations.
function localOf(points, ops) {
  let dx = 0;
  let dy = 0;
  for (const [op, a, b] of ops) {
    if (op === "translate") {
      dx += a;
      dy += b;
    }
  }
  return dx || dy ? points.map(([x, y]) => [x - dx, y - dy]) : points;
}

// A piece of a box on the screen as a rect, painted and clipped like a primitive.
export function piece([x, y, width, height], primitive) {
  const ops = clipsOf(primitive);
  const [[x0, y0]] = localOf([[x, y]], ops);
  return {type: "rect", attrs: {x: x0, y: y0, width, height, ...paintOf(primitive)}, ops};
}

// Primitives in the order of their positions, top to bottom, then left to right, so that they take
// the pieces of a pack in order, without crossing on the way.
export function sortByPosition(primitives) {
  const centers = new Map();
  for (const p of primitives) {
    const [x0, y0, x1, y1] = boxOf(p);
    centers.set(p, [(x0 + x1) / 2, (y0 + y1) / 2]);
  }
  return primitives.slice().sort((a, b) => {
    const [ax, ay] = centers.get(a);
    const [bx, by] = centers.get(b);
    return ay - by || ax - bx;
  });
}

// A primitive morphing from one shape into another. Both outlines, on the screen, are resampled to
// the same number of points, evenly along their lengths, and lined up, so that the shape doesn't
// twist; the points then move from one to the other, drawn as a path, with the paint interpolated.
// At the end, the target is drawn as it is. It's shown always, until it ends, such as a mark
// merging into another, or once it ends.
export function morph(source, show, from, to, {delay, duration, ease}) {
  const a = screenOf(from);
  const b = screenOf(to);
  const closed = a.closed && b.closed;
  const length = Math.max(lengthOf(a.points, a.closed), lengthOf(b.points, b.closed));
  const n = Math.max(16, Math.min(64, Math.round(length / 4)));
  const A = resample(a.points, a.closed, n);
  const B = closed ? align(A, resample(b.points, b.closed, n)) : resample(b.points, b.closed, n);
  const paint = interpolateAttrs(...fade(paintOf(from), paintOf(to)));
  // The path is drawn in the clip of the target, else of the source.
  const clips = clipsOf(to).length ? clipsOf(to) : clipsOf(from);
  const local = (elapsed) =>
    duration > 0 ? Math.max(0, Math.min(1, (elapsed - delay) / duration)) : +(elapsed >= delay);
  return {
    end: delay + duration,
    at(elapsed) {
      const t = local(elapsed);
      if ((show === "until-end" && t >= 1) || (show === "at-end" && t < 1)) return null;
      if (t >= 1) return {...source, type: to.type, attrs: to.attrs, ops: to.ops};
      const e = ease(t);
      const screen = A.map(([x, y], i) => [x + (B[i][0] - x) * e, y + (B[i][1] - y) * e]);
      const points = localOf(screen, clips);
      // The points are kept, and whether they're closed, so that a render during the morph starts
      // from the shape as shown.
      return {...source, type: "path", attrs: {...paint(e), d: pathOf(points, closed)}, ops: clips, points, closed};
    },
  };
}
