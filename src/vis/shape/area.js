import {ascending, InternMap} from "d3-array";
import {
  area as d3area,
  curveBasis,
  curveBumpX,
  curveBumpY,
  curveCardinal,
  curveCatmullRom,
  curveLinear,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
} from "d3-shape";
import {path as d3path} from "d3-path";
import {define} from "../../core/shape/define.js";

// The curves of Plot, by name.
const curves = new Map([
  ["basis", curveBasis],
  ["bump-x", curveBumpX],
  ["bump-y", curveBumpY],
  ["cardinal", curveCardinal],
  ["catmull-rom", curveCatmullRom],
  ["linear", curveLinear],
  ["monotone-x", curveMonotoneX],
  ["monotone-y", curveMonotoneY],
  ["natural", curveNatural],
  ["step", curveStep],
  ["step-after", curveStepAfter],
  ["step-before", curveStepBefore],
]);

function curveOf(curve = "linear") {
  return typeof curve === "function" ? curve : curves.get(`${curve}`.toLowerCase());
}

// The rows of each series, by z, else fill, else stroke, in order of first appearance.
function seriesOf(I, {z, fill, stroke}) {
  const Z = z ?? fill ?? stroke;
  if (!Z) return [I];
  const series = new InternMap();
  for (const i of I) {
    const k = Z[i];
    if (series.has(k)) series.get(k).push(i);
    else series.set(k, [i]);
  }
  return series.values();
}

// The points of a series, sorted by x. A row with a band, such as a bar of cm.spreadX, has a point
// at each edge, so that the area is flat across the bar and curved between bars, like a ribbon.
function pointsOf(I, X, X1, Y, Y1) {
  const points = [];
  for (const i of I.slice().sort((i, j) => ascending(X[i], X[j]))) {
    points.push([X[i], Y[i], Y1[i]]);
    if (X1) points.push([X1[i], Y[i], Y1[i]]);
  }
  return points;
}

const defined = ([x, y, y1]) => isFinite(x) && isFinite(y) && isFinite(y1);

function drawArea(renderer, I, value, options, shape, center) {
  const {
    x: X = [],
    x1: X1,
    y: Y = [],
    y1: Y1 = Y,
    cx: CX = [],
    cy: CY = [],
    fill: F = [],
    stroke: S = [],
    fillOpacity: FO = [],
    strokeOpacity: SO = [],
    strokeWidth: SW = [],
  } = value;
  const path = shape.curve(curveOf(options.curve)).defined(defined);
  for (const series of seriesOf(I, value)) {
    const [i] = series;
    if (i === undefined) continue;
    renderer.path({
      ...(center && {x: CX[i], y: CY[i]}),
      d: path(pointsOf(series, X, X1, Y, Y1)),
      fill: F[i],
      stroke: S[i],
      fillOpacity: FO[i],
      strokeOpacity: SO[i],
      strokeWidth: SW[i],
    });
  }
}

// Draws one area per series, such as the bands of a stacked area chart, from y1 to y along x. Over
// the bands of cm.spreadX, it's flat across each bar, so that with curve "bump-x" it's a ribbon
// between bars. The curve option names a curve of Plot, such as "step" or "bump-x".
export const area = define((renderer, I, value, options = {}) =>
  drawArea(
    renderer,
    I,
    value,
    options,
    d3area()
      .x((d) => d[0])
      .y0((d) => d[2])
      .y1((d) => d[1]),
    false,
  ),
);

// A path context that takes points as angle and radius, and draws them around (0, 0): lines are
// split into steps of at most 0.02 radians, so that they follow the circle, and curves are sampled,
// so that a curve such as "bump-x" bends along the angle, like a ribbon around a circle.
function polarContext() {
  const path = d3path();
  let a0, r0;
  const point = (a, r) => [r * Math.sin(a), -r * Math.cos(a)];
  const to = (a, r) => (path.lineTo(...point(a, r)), (a0 = a), (r0 = r));
  return {
    moveTo(a, r) {
      path.moveTo(...point(a, r));
      ((a0 = a), (r0 = r));
    },
    lineTo(a, r) {
      const n = Math.max(1, Math.ceil(Math.abs(a - a0) / 0.02));
      const [sa, sr] = [a0, r0];
      for (let k = 1; k <= n; k++) to(sa + ((a - sa) * k) / n, sr + ((r - sr) * k) / n);
    },
    bezierCurveTo(a1, r1, a2, r2, a, r) {
      const n = Math.max(8, Math.ceil(Math.abs(a - a0) / 0.02));
      const [sa, sr] = [a0, r0];
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const u = 1 - t;
        const b = (p0, p1, p2, p3) => u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
        to(b(sa, a1, a2, a), b(sr, r1, r2, r));
      }
    },
    closePath() {
      path.closePath();
    },
    toString() {
      return path.toString();
    },
  };
}

// Draws the areas of cm.polar around the center cx and cy: x is the angle and y the outer radius,
// y1 the inner radius, as for cm.arc. The curve applies in angle and radius, and edges follow the
// circle, so that a "bump-x" ribbon spirals between the arcs of its bars.
export const areaRadial = define((renderer, I, value, options = {}) => {
  const shape = d3area()
    .x((d) => d[0])
    .y0((d) => d[2])
    .y1((d) => d[1]);
  const radial = (points) => {
    const context = polarContext();
    shape.context(context)(points);
    return context.toString();
  };
  radial.curve = (curve) => (shape.curve(curve), radial);
  radial.defined = (defined) => (shape.defined(defined), radial);
  drawArea(renderer, I, value, options, radial, true);
});
