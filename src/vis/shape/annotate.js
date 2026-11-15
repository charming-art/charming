import {link} from "../../core/shape/link.js";
import {rect} from "../../core/shape/rect.js";

// The shapes with extents, which span the frame along a position that isn't given.
const spans = new Set([link, rect]);

function constant(value) {
  return typeof value === "function" ? value : () => value;
}

// The values of a position option for each row of the data, if it's given.
function valuesOf(option, data) {
  if (option === undefined) return null;
  const f = constant(option);
  return data.map((d, i) => f(d, i, data));
}

function fill(n, v) {
  return Array.from({length: n}, () => v);
}

// The positions of a cartesian frame, such as cm.plane's: values map through the scales, and a
// missing position spans the frame for shapes with extents, else sits in its middle.
function planePositions({x, y}, frame, P, span) {
  const n = P.x?.length ?? P.y?.length ?? P.x1?.length ?? P.y1?.length ?? 1;
  const map = (scale, V) => (scale ? V.map((v) => scale.apply(v)) : V);
  const axis = (scale, V, V1, [start, end]) => {
    if (!V && !V1) return span ? [fill(n, start), fill(n, end)] : [fill(n, (start + end) / 2), null];
    const P0 = map(scale, V ?? V1);
    return [P0, V1 ? map(scale, V1) : span ? P0 : null];
  };
  const [X, X1] = axis(x, P.x, P.x1, [frame.left, frame.right]);
  const [Y, Y1] = axis(y, P.y, P.y1, [frame.top, frame.bottom]);
  return {n, X, X1, Y, Y1};
}

// The positions of a polar frame, such as cm.polar's: x is an angle and y a radius, turned into
// screen positions around the center. A missing radius spans the frame for shapes with extents,
// such as a spoke, else sits in its middle.
function polarPositions({x, y}, frame, P, span) {
  const {cx, cy, innerRadius, outerRadius, startAngle, endAngle} = frame;
  const n = P.x?.length ?? P.y?.length ?? P.x1?.length ?? P.y1?.length ?? 1;
  const map = (scale, V) => (scale ? V.map((v) => scale.apply(v)) : V);
  const A = P.x ? map(x, P.x) : fill(n, (startAngle + endAngle) / 2);
  const A1 = P.x1 ? map(x, P.x1) : A;
  const middle = (innerRadius + outerRadius) / 2;
  const R = P.y ? map(y, P.y) : fill(n, span ? innerRadius : middle);
  const R1 = P.y1 ? map(y, P.y1) : P.y ? R : fill(n, span ? outerRadius : middle);
  const sx = (r, a) => cx + r * Math.sin(a);
  const sy = (r, a) => cy - r * Math.cos(a);
  return {
    n,
    X: R.map((r, i) => sx(r, A[i])),
    Y: R.map((r, i) => sy(r, A[i])),
    X1: span ? R1.map((r, i) => sx(r, A1[i])) : null,
    Y1: span ? R1.map((r, i) => sy(r, A1[i])) : null,
  };
}

// Turns a shape into an annotation: it draws its own data, given as the data option or a single
// row, with positions x, x1, y and y1 in data units, mapped through the scales recorded by
// cm.plane or cm.polar. A missing position spans the frame for shapes with extents, such as a rule
// drawn with cm.link or a band drawn with cm.rect, else sits in the middle of the frame. The other
// options are passed to the shape. Annotations don't change the scales.
export function annotate(shape) {
  const span = spans.has(shape);
  function annotation(flow, value, {scales = {}, frame, options = {}} = {}) {
    if (!frame) return;
    const {data = [null], x, x1, y, y1, ...rest} = options;
    const D = Array.from(data);
    const P = {x: valuesOf(x, D), x1: valuesOf(x1, D), y: valuesOf(y, D), y1: valuesOf(y1, D)};
    const positions = frame.type === "polar" ? polarPositions : planePositions;
    const {X, X1, Y, Y1} = positions(scales, frame, P, span);
    const at = (V) => (d, i) => V[i];
    flow.data(D).append(shape, {
      ...rest,
      x: at(X),
      y: at(Y),
      ...(X1 && {x1: at(X1)}),
      ...(Y1 && {y1: at(Y1)}),
    });
  }
  // An annotation receives its options as they are, such as accessors of its own data.
  annotation.raw = true;
  return annotation;
}
