import {link} from "../../core/shape/link.js";
import {rect} from "../../core/shape/rect.js";
import {fieldOptions} from "../transform/encode.js";

// The shapes with extents, which span the frame along a position that isn't given.
const spans = new Set([link, rect]);

function constant(value) {
  return typeof value === "function" ? value : () => value;
}

// An accessor of a field of the data.
function field(name) {
  return (d) => d?.[name];
}

// The values of a position option for each row of the data, if it's given: a string names a field
// of the data, if any.
function valuesOf(option, data, fields) {
  if (option === undefined) return null;
  const f = fields && typeof option === "string" ? field(option) : constant(option);
  return data.map((d, i) => f(d, i, data));
}

function fill(n, v) {
  return Array.from({length: n}, () => v);
}

// The positions of a cartesian frame, such as cm.plane's: values map through the scales. A rect
// covers whole bands, from the start of the first to the end of the last, in either order; other
// shapes sit at the middle of a band. A given position is used at both ends, and a missing one
// spans the frame for shapes with extents, else sits in its middle.
function planePositions({x, y}, frame, P, shape) {
  const n = P.x?.length ?? P.y?.length ?? P.x1?.length ?? P.y1?.length ?? 1;
  const span = spans.has(shape);
  const map = (scale, V) => (scale ? V.map((v) => scale.apply(v)) : V);
  const axis = (scale, V, V1, [start, end]) => {
    if (!V && !V1) return span ? [fill(n, start), fill(n, end)] : [fill(n, (start + end) / 2), null];
    const S = map(scale, V ?? V1);
    if (!span) return [S, null];
    const E = map(scale, V1 ?? V);
    if (shape !== rect || scale?.type !== "band") return [S, E];
    // Each end covers its category's band, which varies with flex.
    const half = (v) => Math.abs(scale.width(v)) / 2;
    const A = V ?? V1;
    const B = V1 ?? V;
    return [
      S.map((s, i) => Math.min(s - half(A[i]), E[i] - half(B[i]))),
      E.map((e, i) => Math.max(S[i] + half(A[i]), e + half(B[i]))),
    ];
  };
  const [X, X1] = axis(x, P.x, P.x1, [frame.left, frame.right]);
  const [Y, Y1] = axis(y, P.y, P.y1, [frame.top, frame.bottom]);
  return {n, X, X1, Y, Y1};
}

// The positions of a polar frame, such as cm.polar's: x is an angle and y a radius, turned into
// screen positions around the center. As in a plane, a given angle or radius is used at both ends,
// and a missing radius spans the frame for shapes with extents, such as a spoke, else sits in its
// middle.
function polarPositions({x, y}, frame, P, shape) {
  const {cx, cy, innerRadius, outerRadius, startAngle, endAngle} = frame;
  const n = P.x?.length ?? P.y?.length ?? P.x1?.length ?? P.y1?.length ?? 1;
  const span = spans.has(shape);
  const map = (scale, V) => (scale ? V.map((v) => scale.apply(v)) : V);
  const hasA = P.x || P.x1;
  const A = hasA ? map(x, P.x ?? P.x1) : fill(n, (startAngle + endAngle) / 2);
  const A1 = hasA ? map(x, P.x1 ?? P.x) : A;
  const hasR = P.y || P.y1;
  const middle = (innerRadius + outerRadius) / 2;
  const R = hasR ? map(y, P.y ?? P.y1) : fill(n, span ? innerRadius : middle);
  const R1 = hasR ? map(y, P.y1 ?? P.y) : fill(n, span ? outerRadius : middle);
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
// row, with positions x, x1, y and y1 in data units, mapped through the scales recorded by cm.plane
// or cm.polar; with data, the strings of its channels name fields of it. A missing position spans
// the frame for shapes with extents, such as a rule drawn with cm.link or a band drawn with
// cm.rect, else sits in the middle of the frame. The other options are passed to the shape.
// Annotations don't change the scales.
export function annotate(shape) {
  function annotation(flow, value, {scales = {}, frame, options = {}} = {}) {
    if (!frame) return;
    const {data, x, x1, y, y1, ...rest} = options;
    // Like the marks of an encoded flow, an annotation with data reads the strings of its channels
    // as fields of it, such as {x: "length", text: "note"}; one without data, a single row, has
    // none, so its strings are constants, such as {x: "A"} for a band.
    const fields = data !== undefined;
    const D = fields ? Array.from(data) : [null];
    const P = {
      x: valuesOf(x, D, fields),
      x1: valuesOf(x1, D, fields),
      y: valuesOf(y, D, fields),
      y1: valuesOf(y1, D, fields),
    };
    const own = fields ? fieldOptions(rest, {}, field) : rest;
    const positions = frame.type === "polar" ? polarPositions : planePositions;
    const {X, X1, Y, Y1} = positions(scales, frame, P, shape);
    const at = (V) => (d, i) => V[i];
    flow.data(D).append(shape, {
      ...own,
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
